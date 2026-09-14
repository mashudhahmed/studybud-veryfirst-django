from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from base.models import Topic, Room, Message


class ReportApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Admin user
        self.admin_user = User.objects.create_superuser(
            username='adminuser',
            email='admin@example.com',
            password='password123'
        )

        # Normal user
        self.normal_user = User.objects.create_user(
            username='regularuser',
            email='regular@example.com',
            password='password123'
        )

        # Topic & Room
        self.topic = Topic.objects.create(name='Python Testing')
        self.room = Room.objects.create(
            host=self.admin_user,
            topic=self.topic,
            name='Test Study Room',
            description='A room for testing reports'
        )
        self.room.participants.add(self.normal_user)

        # Message
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

    def test_user_report_json_preview(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get('/api/admin/reports/users/?role=all')
        self.assertEqual(res.status_code, 200)
        self.assertIn('summary', res.data)
        self.assertIn('results', res.data)
        self.assertGreaterEqual(res.data['summary']['total_users'], 2)

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
        self.assertIn('spreadsheetml.sheet', res['Content-Type'])
        self.assertIn('.xlsx', res['Content-Disposition'])

    def test_room_report_json_preview(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.get(f'/api/admin/reports/rooms/?topic_id={self.topic.id}&creator_id={self.admin_user.id}')
        self.assertEqual(res.status_code, 200)
        self.assertIn('summary', res.data)
        self.assertEqual(res.data['summary']['total_rooms'], 1)
        self.assertEqual(res.data['results'][0]['name'], 'Test Study Room')

    def test_room_report_date_filtering(self):
        self.client.force_authenticate(user=self.admin_user)
        today = date.today()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)

        # In range
        res = self.client.get(f'/api/admin/reports/rooms/?start_date={yesterday}&end_date={tomorrow}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['summary']['total_rooms'], 1)

        # Out of range
        past = today - timedelta(days=10)
        older = today - timedelta(days=5)
        res_out = self.client.get(f'/api/admin/reports/rooms/?start_date={past}&end_date={older}')
        self.assertEqual(res_out.status_code, 200)
        self.assertEqual(res_out.data['summary']['total_rooms'], 0)

    def test_room_report_csv_and_xlsx_export(self):
        self.client.force_authenticate(user=self.admin_user)
        # CSV
        res_csv = self.client.get('/api/admin/reports/rooms/?export=csv')
        self.assertEqual(res_csv.status_code, 200)
        self.assertIn('attachment;', res_csv['Content-Disposition'])

        # XLSX
        res_xlsx = self.client.get('/api/admin/reports/rooms/?export=xlsx')
        self.assertEqual(res_xlsx.status_code, 200)
        self.assertIn('spreadsheetml.sheet', res_xlsx['Content-Type'])

        # XLS
        res_xls = self.client.get('/api/admin/reports/rooms/?export=xls')
        self.assertEqual(res_xls.status_code, 200)
        self.assertIn('.xls', res_xls['Content-Disposition'])
