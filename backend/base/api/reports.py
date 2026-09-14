import csv
import io
from datetime import datetime

from django.http import HttpResponse
from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.utils.dateparse import parse_date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from base.models import Room, Topic, Message


def _build_csv_response(filename, headers, rows):
    """Generates a CSV HttpResponse with UTF-8 BOM for universal Excel compatibility."""
    buffer = io.StringIO()
    # Write UTF-8 BOM so Excel opens non-ASCII characters cleanly
    buffer.write('\ufeff')
    writer = csv.writer(buffer)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(row)

    response = HttpResponse(buffer.getvalue(), content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
    return response


def _build_excel_response(filename, headers, rows, sheet_title='Report', file_ext='xlsx'):
    """Generates a styled Excel spreadsheet using openpyxl."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = sheet_title[:31]

    # Header styling
    header_fill = PatternFill(start_color='2C3E50', end_color='2C3E50', fill_type='solid')
    header_font = Font(name='Calibri', size=11, bold=True, color='FFFFFF')
    header_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

    thin_border = Border(
        left=Side(style='thin', color='E0E0E0'),
        right=Side(style='thin', color='E0E0E0'),
        top=Side(style='thin', color='E0E0E0'),
        bottom=Side(style='thin', color='E0E0E0'),
    )

    data_font = Font(name='Calibri', size=10)
    data_alignment = Alignment(vertical='center')

    # Append headers
    ws.append(headers)
    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = header_alignment
        cell.border = thin_border

    ws.row_dimensions[1].height = 28

    # Append rows
    for row_idx, row_data in enumerate(rows, start=2):
        ws.append(row_data)
        ws.row_dimensions[row_idx].height = 20
        is_even = row_idx % 2 == 0
        stripe_fill = PatternFill(start_color='F8F9FA', end_color='F8F9FA', fill_type='solid') if is_even else None

        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.font = data_font
            cell.alignment = data_alignment
            cell.border = thin_border
            if stripe_fill:
                cell.fill = stripe_fill

    # Auto-adjust column widths
    for col_idx, col in enumerate(ws.columns, start=1):
        max_len = 0
        col_letter = get_column_letter(col_idx)
        for cell in col:
            val_str = str(cell.value or '')
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    content_type = (
        'application/vnd.ms-excel' if file_ext == 'xls'
        else 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response = HttpResponse(buf.getvalue(), content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename="{filename}.{file_ext}"'
    return response


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_report_filter_options(request):
    """Provides dropdown filter options (users, roles, topics) for reports."""
    users = (
        User.objects.all()
        .order_by('username')
        .values('id', 'username', 'first_name', 'last_name', 'email')
    )
    topics = (
        Topic.objects.all()
        .order_by('name')
        .values('id', 'name')
    )

    roles = [
        {'value': 'all', 'label': 'All Roles'},
        {'value': 'superuser', 'label': 'Admin / Superuser'},
        {'value': 'staff', 'label': 'Staff'},
        {'value': 'member', 'label': 'Regular Member'},
        {'value': 'active', 'label': 'Active Accounts'},
        {'value': 'inactive', 'label': 'Inactive / Banned'},
    ]

    return Response({
        'users': list(users),
        'topics': list(topics),
        'roles': roles,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_user_report(request):
    """
    Generates User Report filtered by role, username, or search.
    Supports preview JSON and direct downloads for csv, xls, xlsx via ?export=...
    """
    role = request.GET.get('role', 'all')
    user_id = request.GET.get('user_id')
    search = request.GET.get('search', '').strip()
    export_format = (request.GET.get('export') or request.GET.get('file_format') or '').lower()

    qs = (
        User.objects.all()
        .select_related('profile')
        .annotate(
            rooms_hosted_count=Count('room', distinct=True),
            messages_sent_count=Count('message', distinct=True),
            rooms_joined_count=Count('participants', distinct=True),
        )
        .order_by('-date_joined')
    )

    if role == 'superuser':
        qs = qs.filter(is_superuser=True)
    elif role == 'staff':
        qs = qs.filter(is_staff=True, is_superuser=False)
    elif role == 'member':
        qs = qs.filter(is_staff=False, is_superuser=False)
    elif role == 'active':
        qs = qs.filter(is_active=True)
    elif role == 'inactive':
        qs = qs.filter(is_active=False)

    if user_id and user_id != 'all':
        qs = qs.filter(id=user_id)

    if search:
        qs = qs.filter(Q(username__icontains=search) | Q(email__icontains=search))

    user_list = list(qs)

    summary = {
        'total_users': len(user_list),
        'total_rooms_hosted': sum(u.rooms_hosted_count for u in user_list),
        'total_messages_sent': sum(u.messages_sent_count for u in user_list),
        'total_rooms_joined': sum(u.rooms_joined_count for u in user_list),
    }

    # Handle Export Formats
    if export_format in ['csv', 'xls', 'xlsx']:
        timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"user_report_{timestamp_str}"
        headers = [
            'ID',
            'Username',
            'Email',
            'Role',
            'Status',
            'Date Joined',
            'Last Login',
            'Rooms Hosted',
            'Rooms Joined',
            'Messages Sent',
        ]
        rows = []
        for u in user_list:
            role_label = 'Superuser' if u.is_superuser else ('Staff' if u.is_staff else 'Member')
            status_label = 'Active' if u.is_active else 'Inactive'
            joined_str = u.date_joined.strftime('%Y-%m-%d %H:%M') if u.date_joined else ''
            login_str = u.last_login.strftime('%Y-%m-%d %H:%M') if u.last_login else 'Never'
            rows.append([
                u.id,
                u.username,
                u.email or 'N/A',
                role_label,
                status_label,
                joined_str,
                login_str,
                u.rooms_hosted_count,
                u.rooms_joined_count,
                u.messages_sent_count,
            ])

        if export_format == 'csv':
            return _build_csv_response(filename, headers, rows)
        else:
            return _build_excel_response(filename, headers, rows, sheet_title='User Report', file_ext=export_format)

    # JSON Preview
    results = []
    for u in user_list:
        role_label = 'Superuser' if u.is_superuser else ('Staff' if u.is_staff else 'Member')
        results.append({
            'id': u.id,
            'username': u.username,
            'email': u.email or 'N/A',
            'role': role_label,
            'is_active': u.is_active,
            'date_joined': u.date_joined.strftime('%Y-%m-%d %H:%M') if u.date_joined else '',
            'last_login': u.last_login.strftime('%Y-%m-%d %H:%M') if u.last_login else 'Never',
            'rooms_hosted': u.rooms_hosted_count,
            'rooms_joined': u.rooms_joined_count,
            'messages_sent': u.messages_sent_count,
            'avatar': u.profile.avatar.url if hasattr(u, 'profile') and u.profile.avatar else None,
        })

    return Response({
        'summary': summary,
        'results': results,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_room_report(request):
    """
    Generates Room Report filtered by topic, creator, participant, and date range.
    Supports preview JSON and direct downloads for csv, xls, xlsx via ?export=...
    """
    topic_id = request.GET.get('topic_id')
    creator_id = request.GET.get('creator_id')
    participant_id = request.GET.get('participant_id')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    search = request.GET.get('search', '').strip()
    export_format = (request.GET.get('export') or request.GET.get('file_format') or '').lower()

    qs = (
        Room.objects.all()
        .select_related('host', 'topic')
        .prefetch_related('participants')
        .annotate(
            participant_count=Count('participants', distinct=True),
            message_count=Count('message', distinct=True),
        )
        .order_by('-created')
    )

    if topic_id and topic_id != 'all':
        qs = qs.filter(topic_id=topic_id)

    if creator_id and creator_id != 'all':
        qs = qs.filter(host_id=creator_id)

    if participant_id and participant_id != 'all':
        qs = qs.filter(participants__id=participant_id)

    if start_date:
        parsed_start = parse_date(start_date)
        if parsed_start:
            qs = qs.filter(created__date__gte=parsed_start)

    if end_date:
        parsed_end = parse_date(end_date)
        if parsed_end:
            qs = qs.filter(created__date__lte=parsed_end)

    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

    room_list = list(qs)

    summary = {
        'total_rooms': len(room_list),
        'total_messages': sum(r.message_count for r in room_list),
        'total_participants': sum(r.participant_count for r in room_list),
    }

    # Handle Export Formats
    if export_format in ['csv', 'xls', 'xlsx']:
        timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"room_report_{timestamp_str}"
        headers = [
            'Room ID',
            'Room Name',
            'Topic',
            'Creator (Host)',
            'Date Created',
            'Last Updated',
            'Participants Count',
            'Messages Count',
            'Participants List',
        ]
        rows = []
        for r in room_list:
            host_str = r.host.username if r.host else 'Deleted User'
            topic_str = r.topic.name if r.topic else 'General'
            created_str = r.created.strftime('%Y-%m-%d %H:%M') if r.created else ''
            updated_str = r.updated.strftime('%Y-%m-%d %H:%M') if r.updated else ''
            participants_str = ', '.join([p.username for p in r.participants.all()[:15]])
            rows.append([
                r.id,
                r.name,
                topic_str,
                host_str,
                created_str,
                updated_str,
                r.participant_count,
                r.message_count,
                participants_str,
            ])

        if export_format == 'csv':
            return _build_csv_response(filename, headers, rows)
        else:
            return _build_excel_response(filename, headers, rows, sheet_title='Room Report', file_ext=export_format)

    # JSON Preview
    results = []
    for r in room_list:
        results.append({
            'id': r.id,
            'name': r.name,
            'topic': r.topic.name if r.topic else 'General',
            'host_username': r.host.username if r.host else 'Deleted User',
            'created': r.created.strftime('%Y-%m-%d %H:%M') if r.created else '',
            'updated': r.updated.strftime('%Y-%m-%d %H:%M') if r.updated else '',
            'participants_count': r.participant_count,
            'messages_count': r.message_count,
            'participants': [p.username for p in r.participants.all()[:10]],
        })

    return Response({
        'summary': summary,
        'results': results,
    })
