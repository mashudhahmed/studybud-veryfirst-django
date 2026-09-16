from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from base.models import Topic, Room, Message


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




