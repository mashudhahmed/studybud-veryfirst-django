from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework_simplejwt.views import TokenRefreshView

from . import views
from . import reports

urlpatterns = [

    path('', views.getRoutes),

    # auth
    path('token/', views.ThrottledTokenObtainPairView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('token-auth/', obtain_auth_token),
    path('register/', views.registerUser),
    path('logout/', views.logoutUser),
    path('me/', views.getMe),

    # system config
    path('config/', views.getSystemConfig),

    # room
    path('rooms/', views.getRooms),
    path('rooms/create/', views.createRoom),
    path('rooms/<str:pk>/', views.getRoom),
    path('rooms/<str:pk>/update/', views.updateRoom),
    path('rooms/<str:pk>/delete/', views.deleteRoom),

    # messages
    path('messages/', views.getMessages),
    path('messages/create/', views.createMessage),
    path('messages/<str:pk>/', views.getMessage),
    path('messages/<str:pk>/update/', views.updateMessage),
    path('messages/<str:pk>/delete/', views.deleteMessage),

    # topics
    path('topics/', views.getTopics),
    path('topics/<str:pk>/', views.getTopic),

    # profile
    path('profile/me/', views.getMyProfile),
    path('profile/update/', views.updateProfile),
    path('profile/<str:pk>/', views.getProfile),

    path('users/<str:pk>/', views.getUserProfile),

    # admin dashboard (superuser only)
    path('admin/stats/', views.adminGetStats),
    path('admin/config/', views.adminSystemConfig),

    path('admin/users/', views.adminGetUsers),
    path('admin/users/<str:pk>/', views.adminUpdateUser),
    path('admin/users/<str:pk>/delete/', views.adminDeleteUser),

    path('admin/rooms/', views.adminGetRooms),
    path('admin/rooms/<str:pk>/update/', views.adminUpdateRoom),
    path('admin/rooms/<str:pk>/delete/', views.adminDeleteRoom),

    path('admin/topics/', views.adminGetTopics),
    path('admin/topics/create/', views.adminCreateTopic),
    path('admin/topics/<str:pk>/update/', views.adminUpdateTopic),
    path('admin/topics/<str:pk>/delete/', views.adminDeleteTopic),

    # admin reports
    path('admin/reports/options/', reports.admin_report_filter_options),
    path('admin/reports/users/', reports.admin_user_report),
    path('admin/reports/rooms/', reports.admin_room_report),
]