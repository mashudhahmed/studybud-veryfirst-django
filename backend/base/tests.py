from datetime import date, timedelta
import io
import openpyxl
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from base.models import Topic, Room, Message


class AdminRoomCreateApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin_user = User.objects.create_superuser(
            username='adminuser',
            email='admin@example.com',
            password='password123'
        )

        self.normal_user = User.objects.create_user(
            username='regularuser',
            email='regular@example.com',
            password='password123'
        )

        self.topic = Topic.objects.create(name='Django Dev')

    def test_admin_create_room_unauthenticated(self):
        res = self.client.post('/api/admin/rooms/create/', {
            'name': 'Test Room',
            'topic': 'Django Dev',
        })
        self.assertEqual(res.status_code, 401)

    def test_admin_create_room_forbidden_for_regular_user(self):
        self.client.force_authenticate(user=self.normal_user)
        res = self.client.post('/api/admin/rooms/create/', {
            'name': 'Test Room',
            'topic': 'Django Dev',
        })
        self.assertEqual(res.status_code, 403)

    def test_admin_create_room_success(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.post('/api/admin/rooms/create/', {
            'name': 'Superuser Room',
            'topic': 'Django Dev',
            'description': 'Created by superuser from admin dashboard',
            'host': self.admin_user.id,
            'participants': [self.admin_user.id, self.normal_user.id],
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['name'], 'Superuser Room')
        self.assertEqual(res.data['host']['username'], 'adminuser')
        self.assertEqual(len(res.data['participants']), 2)

    def test_admin_create_room_with_assigned_host(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.post('/api/admin/rooms/create/', {
            'name': 'Assigned Host Room',
            'topic': 'Django Dev',
            'description': 'Admin assigned regular user as host',
            'host': self.normal_user.id,
            'participants': [self.normal_user.id],
        })
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['host']['username'], 'regularuser')


class AdminRoomBulkUploadApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin_user = User.objects.create_superuser(
            username='adminuser',
            email='admin@example.com',
            password='password123'
        )

        self.normal_user = User.objects.create_user(
            username='regularuser',
            email='regular@example.com',
            password='password123'
        )

        self.topic = Topic.objects.create(name='Python')

    def test_upload_template_unauthenticated(self):
        res = self.client.get('/api/admin/rooms/upload-template/')
        self.assertEqual(res.status_code, 401)

    def test_upload_template_forbidden_for_regular_user(self):
        self.client.force_authenticate(user=self.normal_user)
        res = self.client.get('/api/admin/rooms/upload-template/')
        self.assertEqual(res.status_code, 403)

    def test_upload_template_success(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get('/api/admin/rooms/upload-template/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(
            res['Content-Type'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        self.assertIn('studybud_rooms_template.xlsx', res['Content-Disposition'])

    def test_bulk_upload_unauthenticated(self):
        res = self.client.post('/api/admin/rooms/bulk-upload/')
        self.assertEqual(res.status_code, 401)

    def test_bulk_upload_forbidden_for_regular_user(self):
        self.client.force_authenticate(user=self.normal_user)
        res = self.client.post('/api/admin/rooms/bulk-upload/')
        self.assertEqual(res.status_code, 403)

    def test_bulk_upload_no_file(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.post('/api/admin/rooms/bulk-upload/', {})
        self.assertEqual(res.status_code, 400)
        self.assertIn('No file uploaded', res.data['detail'])

    def test_bulk_upload_invalid_extension(self):
        self.client.force_authenticate(user=self.admin_user)
        fake_file = SimpleUploadedFile("rooms.csv", b"name,topic\nRoom 1,Python", content_type="text/csv")
        res = self.client.post('/api/admin/rooms/bulk-upload/', {'file': fake_file}, format='multipart')
        self.assertEqual(res.status_code, 400)
        self.assertIn('Invalid file format', res.data['detail'])

    def test_bulk_upload_success_automatic_host(self):
        self.client.force_authenticate(user=self.admin_user)

        # Build in-memory xlsx file with 2 valid rooms
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(['name', 'topic', 'description', 'participants'])
        ws.append(['Valid Room One', 'Python', 'A valid room', 'regularuser'])
        ws.append(['Valid Room Two', 'NewTopicAutoCreated', 'Auto topic room', ''])

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)

        uploaded = SimpleUploadedFile(
            'rooms_bulk.xlsx',
            buf.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

        res = self.client.post('/api/admin/rooms/bulk-upload/', {'file': uploaded}, format='multipart')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['total_rows'], 2)
        self.assertEqual(res.data['created_count'], 2)
        self.assertEqual(len(res.data['errors']), 0)
        self.assertEqual(len(res.data['duplicates']), 0)

        # Verify rooms are created and automatically hosted by uploading admin
        room1 = Room.objects.filter(name='Valid Room One').first()
        self.assertIsNotNone(room1)
        self.assertEqual(room1.host, self.admin_user)
        self.assertEqual(room1.topic.name, 'Python')
        self.assertEqual(room1.participants.count(), 2)  # adminuser + regularuser

        room2 = Room.objects.filter(name='Valid Room Two').first()
        self.assertIsNotNone(room2)
        self.assertEqual(room2.host, self.admin_user)
        self.assertEqual(room2.topic.name, 'NewTopicAutoCreated')

    def test_bulk_upload_all_or_nothing_aborts_on_error(self):
        self.client.force_authenticate(user=self.admin_user)

        # Build in-memory xlsx file with 1 valid row and 1 invalid row (< 3 chars)
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(['name', 'topic', 'description'])
        ws.append(['Valid Room Alpha', 'Python', 'A valid room'])
        ws.append(['AB', 'Short Name', ''])  # invalid: < 3 chars

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)

        uploaded = SimpleUploadedFile(
            'rooms_invalid.xlsx',
            buf.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

        res = self.client.post('/api/admin/rooms/bulk-upload/', {'file': uploaded}, format='multipart')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['total_rows'], 2)
        # All-or-nothing: 0 rooms created because 1 error exists
        self.assertEqual(res.data['created_count'], 0)
        self.assertEqual(len(res.data['errors']), 1)
        self.assertIn('at least 3 characters', res.data['errors'][0]['error'])

        # Verify nothing was saved to DB
        self.assertFalse(Room.objects.filter(name='Valid Room Alpha').exists())

    def test_bulk_upload_duplicate_prevention_aborts_all(self):
        self.client.force_authenticate(user=self.admin_user)

        # Pre-create a room in the DB
        Room.objects.create(name='Existing Database Room', topic=self.topic, host=self.admin_user)

        # Build file with: existing DB room and fresh room
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(['name', 'topic', 'description'])
        ws.append(['Existing Database Room', 'Python', 'Should trigger duplicate abort'])
        ws.append(['Unique Fresh Room', 'Python', 'Should not be created due to all-or-nothing'])

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)

        uploaded = SimpleUploadedFile(
            'rooms_dups.xlsx',
            buf.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

        res = self.client.post('/api/admin/rooms/bulk-upload/', {'file': uploaded}, format='multipart')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['created_count'], 0)
        self.assertEqual(res.data['skipped_duplicates_count'], 1)
        self.assertEqual(len(res.data['duplicates']), 1)

        # Verify fresh room was NOT created
        self.assertFalse(Room.objects.filter(name='Unique Fresh Room').exists())

    def test_bulk_upload_flexible_header_matching(self):
        self.client.force_authenticate(user=self.admin_user)

        # Build file with empty row before header and alternative column titles
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.append(['StudyBud Rooms Export - Title Header'])  # Non-header row
        ws.append(['Room Name', 'Category', 'About', 'Members'])
        ws.append(['Flexible Header Room', 'Web Dev', 'Created with custom headers', 'regularuser'])

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)

        uploaded = SimpleUploadedFile(
            'rooms_flexible.xlsx',
            buf.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

        res = self.client.post('/api/admin/rooms/bulk-upload/', {'file': uploaded}, format='multipart')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['created_count'], 1)
        self.assertEqual(res.data['skipped_duplicates_count'], 0)
        self.assertEqual(len(res.data['errors']), 0)

        room = Room.objects.filter(name='Flexible Header Room').first()
        self.assertIsNotNone(room)
        self.assertEqual(room.topic.name, 'Web Dev')
        self.assertEqual(room.host, self.admin_user)


class ReportApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.admin_user = User.objects.create_superuser(
            username='adminuser',
            email='admin@example.com',
            password='password123'
        )

        self.normal_user = User.objects.create_user(
            username='regularuser',
            email='regular@example.com',
            password='password123'
        )

        self.topic = Topic.objects.create(name='Python Testing')
        self.room = Room.objects.create(
            host=self.admin_user,
            topic=self.topic,
            name='Test Study Room',
            description='A room for testing reports'
        )
        self.room.participants.add(self.normal_user)

        self.message = Message.objects.create(
            user=self.normal_user,
            room=self.room,
            body='Hello in the test room'
        )

    def test_filter_options_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get('/api/admin/reports/options/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('users', res.data)
        self.assertIn('topics', res.data)
        self.assertIn('roles', res.data)

    def test_filter_options_forbidden_for_regular_user(self):
        self.client.force_authenticate(user=self.normal_user)
        res = self.client.get('/api/admin/reports/options/')
        self.assertEqual(res.status_code, 403)

    def test_user_report_csv_export(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get('/api/admin/reports/users/?export=csv')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'text/csv; charset=utf-8')
        self.assertIn('attachment;', res['Content-Disposition'])

    def test_user_report_xlsx_export(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get('/api/admin/reports/users/?export=xlsx')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        self.assertIn('attachment;', res['Content-Disposition'])

    def test_user_report_no_data_found_returns_404(self):
        self.client.force_authenticate(user=self.admin_user)
        # Search for non-existent user
        res = self.client.get('/api/admin/reports/users/?export=csv&search=nonexistentuser9999')
        self.assertEqual(res.status_code, 404)
        self.assertIn('detail', res.data)

    def test_room_report_date_range_mandatory(self):
        self.client.force_authenticate(user=self.admin_user)
        # Missing dates
        res = self.client.get('/api/admin/reports/rooms/?export=csv')
        self.assertEqual(res.status_code, 400)
        self.assertIn('detail', res.data)

    def test_room_report_date_filtering_and_export(self):
        self.client.force_authenticate(user=self.admin_user)
        today = date.today()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)

        # In range with data -> 200 with file
        res = self.client.get(f'/api/admin/reports/rooms/?export=csv&start_date={yesterday}&end_date={tomorrow}')
        self.assertEqual(res.status_code, 200)
        self.assertIn('attachment;', res['Content-Disposition'])

        # Out of range (0 records) -> 404 No data found
        past = today - timedelta(days=10)
        older = today - timedelta(days=5)
        res_out = self.client.get(f'/api/admin/reports/rooms/?export=csv&start_date={past}&end_date={older}')
        self.assertEqual(res_out.status_code, 404)
        self.assertIn('detail', res_out.data)

    def test_user_report_html_export(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get('/api/admin/reports/users/?export=html')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'text/html; charset=utf-8')
        content = res.content.decode('utf-8')
        self.assertIn('STUDYBUD — USER ACTIVITY REPORT', content)
        self.assertIn('REPORT DETAILS &amp; FILTER CRITERIA', content)
        self.assertIn('size: auto', content)
        self.assertIn('table-header-group', content)
        self.assertIn('page-break-inside: avoid', content)

    def test_room_report_html_export_with_auto_print(self):
        self.client.force_authenticate(user=self.admin_user)
        today = date.today()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)

        res = self.client.get(f'/api/admin/reports/rooms/?export=html&auto_print=1&start_date={yesterday}&end_date={tomorrow}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'text/html; charset=utf-8')
        content = res.content.decode('utf-8')
        self.assertIn('STUDYBUD — ROOM ACTIVITY REPORT', content)
        self.assertIn('window.print()', content)
        self.assertIn('size: auto', content)
        self.assertIn('table-header-group', content)

    def test_user_report_pdf_export(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get('/api/admin/reports/users/?export=pdf')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'application/pdf')
        self.assertIn('.pdf', res['Content-Disposition'])
        self.assertTrue(res.content.startswith(b'%PDF-'))
        self.assertEqual(res['X-Report-Tier'], 'tier1')
        self.assertEqual(res['X-Report-Orientation'], 'portrait')
        self.assertTrue(float(res['X-Report-Measured-Width']) > 0)

    def test_user_report_pdf_landscape_override(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get('/api/admin/reports/users/?export=pdf&orientation=landscape')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'application/pdf')
        self.assertEqual(res['X-Report-Orientation'], 'landscape')

    def test_user_report_check_fit(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get('/api/admin/reports/users/?check_fit=1')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['tier'], 'tier1')
        self.assertEqual(res.data['recommended'], 'portrait')
        self.assertTrue(res.data['measured_width'] > 0)
        self.assertGreaterEqual(res.data['total_records'], 2)

    def test_room_report_pdf_export(self):
        self.client.force_authenticate(user=self.admin_user)
        today = date.today()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)
        res = self.client.get(f'/api/admin/reports/rooms/?export=pdf&start_date={yesterday}&end_date={tomorrow}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'application/pdf')
        self.assertIn('.pdf', res['Content-Disposition'])
        self.assertTrue(res.content.startswith(b'%PDF-'))
        self.assertEqual(res['X-Report-Tier'], 'tier1')
        self.assertEqual(res['X-Report-Orientation'], 'portrait')
        self.assertTrue(float(res['X-Report-Measured-Width']) > 0)

    def test_room_report_check_fit(self):
        self.client.force_authenticate(user=self.admin_user)
        today = date.today()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)
        res = self.client.get(f'/api/admin/reports/rooms/?check_fit=1&start_date={yesterday}&end_date={tomorrow}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['tier'], 'tier1')
        self.assertEqual(res.data['recommended'], 'portrait')
        self.assertTrue(res.data['measured_width'] > 0)
        self.assertGreaterEqual(res.data['total_records'], 1)

    def test_room_report_check_fit_date_range_mandatory(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get('/api/admin/reports/rooms/?check_fit=1')
        self.assertEqual(res.status_code, 400)
        self.assertIn('detail', res.data)
