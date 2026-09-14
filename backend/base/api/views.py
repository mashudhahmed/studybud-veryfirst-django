from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework import status, serializers
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.db.models import Q
from rest_framework.pagination import PageNumberPagination

from django.contrib.auth.models import User

from base.api.serializer import (
    RoomSerializer, RoomWriteSerializer,
    MessageSerializer, MessageWriteSerializer, MessageUpdateSerializer,
    TopicSerializer, ProfileSerializer, ProfileUpdateSerializer,
    UserSerializer, PublicUserSerializer, RegisterSerializer,
    AdminUserSerializer, AdminUserUpdateSerializer, AdminTopicWriteSerializer,
    AppConfigSerializer,
)
from base.models import Room, Message, Topic, Profile, AppConfig

from base.api.permissions import IsHostOrReadOnly, IsMessageOwnerOrReadOnly, IsSuperUser
from base.api.throttles import LoginRateThrottle, RegisterRateThrottle


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        try:
            user_obj = User.objects.get(username__iexact=username)
        except User.DoesNotExist:
            user_obj = None

        if user_obj is not None and not user_obj.is_active:
            from rest_framework.exceptions import AuthenticationFailed
            raise AuthenticationFailed(
                'This account has been deactivated. Please contact support.'
            )

        data = super().validate(attrs)

        config = AppConfig.objects.first()
        data['session_timeout_seconds'] = config.session_timeout_seconds if config else 300
        return data


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle]
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def getRoutes(request):
    routes = [
        'GET /api/',
        'POST /api/token/',
        'POST /api/token/refresh/',
        'POST /api/register/',
        'POST /api/logout/',
        'GET /api/me/',
        'GET /api/config/',
        'GET /api/rooms/',
        'GET /api/rooms/:id/',
        'POST /api/rooms/create/',
        'PUT /api/rooms/:id/update/',
        'DELETE /api/rooms/:id/delete/',
        'GET /api/messages/',
        'GET /api/messages/:id/',
        'POST /api/messages/create/',
        'PUT /api/messages/:id/update/',
        'DELETE /api/messages/:id/delete/',
        'GET /api/topics/',
        'GET /api/topics/:id/',
        'GET /api/profile/me/',
        'GET /api/profile/:id/',
        'PUT /api/profile/update/',
        'GET /api/users/:id/',
        'GET /api/admin/stats/',
        'GET /api/admin/config/',
        'PUT /api/admin/config/',
        'GET /api/admin/users/',
        'PATCH /api/admin/users/:id/',
        'DELETE /api/admin/users/:id/',
        'GET /api/admin/rooms/',
        'PUT /api/admin/rooms/:id/',
        'DELETE /api/admin/rooms/:id/',
        'GET /api/admin/topics/',
        'POST /api/admin/topics/create/',
        'PUT /api/admin/topics/:id/update/',
        'DELETE /api/admin/topics/:id/delete/',
    ]
    return Response(routes)


# -------------------- SYSTEM CONFIG --------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def getSystemConfig(request):
    config = AppConfig.objects.first()
    timeout = config.session_timeout_seconds if config else 300
    return Response({'session_timeout_seconds': timeout})


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsSuperUser])
def adminSystemConfig(request):
    config, _ = AppConfig.objects.get_or_create(id=1)

    if request.method == 'GET':
        serializer = AppConfigSerializer(config)
        return Response(serializer.data)

    serializer = AppConfigSerializer(config, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


# -------------------- AUTH --------------------

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([RegisterRateThrottle])
def registerUser(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    refresh = RefreshToken.for_user(user)
    return Response(
        {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user, context={'request': request}).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logoutUser(request):
    Token.objects.filter(user=request.user).delete()

    refresh_token = request.data.get('refresh')
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {'detail': 'Invalid or already-blacklisted refresh token'},
                status=status.HTTP_400_BAD_REQUEST
            )

    return Response({'detail': 'Logged out - tokens invalidated'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getMe(request):
    return Response(UserSerializer(request.user, context={'request': request}).data)


# -------------------- ROOMS --------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def getRooms(request):
    rooms = Room.objects.all()

    topic = request.query_params.get('topic')
    if topic:
        rooms = rooms.filter(topic__name__iexact=topic)

    q = request.query_params.get('q')
    if q:
        rooms = rooms.filter(
            Q(name__icontains=q) |
            Q(description__icontains=q) |
            Q(topic__name__icontains=q)
        )

    serializer = RoomSerializer(rooms, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def getRoom(request, pk):
    try:
        room = Room.objects.get(id=pk)
    except Room.DoesNotExist:
        raise NotFound('Room not found')

    serializer = RoomSerializer(room, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createRoom(request):
    serializer = RoomWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    room = serializer.save(host=request.user)
    room.participants.add(request.user)

    return Response(
        RoomSerializer(room, context={'request': request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def updateRoom(request, pk):
    try:
        room = Room.objects.get(id=pk)
    except Room.DoesNotExist:
        raise NotFound('Room not found')

    if request.user != room.host:
        raise PermissionDenied('You are not the host of this room')

    serializer = RoomWriteSerializer(room, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    room = serializer.save()

    return Response(RoomSerializer(room, context={'request': request}).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteRoom(request, pk):
    try:
        room = Room.objects.get(id=pk)
    except Room.DoesNotExist:
        raise NotFound('Room not found')

    if request.user != room.host:
        raise PermissionDenied('You are not the host of this room')

    room.delete()
    return Response({'detail': 'Room deleted'}, status=status.HTTP_200_OK)


# -------------------- MESSAGES --------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def getMessages(request):
    messages = Message.objects.all()

    room_id = request.query_params.get('room')
    if room_id:
        messages = messages.filter(room__id=room_id)

    user_id = request.query_params.get('user')
    if user_id:
        if not (request.user and request.user.is_authenticated and request.user.is_superuser):
            raise PermissionDenied('Only admins can filter messages by user')
        messages = messages.filter(user__id=user_id)

    paginator = PageNumberPagination()
    try:
        page_size = int(request.query_params.get('page_size', 20))
        page_size = max(1, min(page_size, 100))
    except (TypeError, ValueError):
        page_size = 20
    paginator.page_size = page_size
    page = paginator.paginate_queryset(messages, request)
    serializer = MessageSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def getMessage(request, pk):
    try:
        message = Message.objects.get(id=pk)
    except Message.DoesNotExist:
        raise NotFound('Message not found')

    serializer = MessageSerializer(message, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createMessage(request):
    serializer = MessageWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    message = serializer.save(user=request.user)
    message.room.participants.add(request.user)

    return Response(
        MessageSerializer(message, context={'request': request}).data,
        status=status.HTTP_201_CREATED,
    )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def updateMessage(request, pk):
    try:
        message = Message.objects.get(id=pk)
    except Message.DoesNotExist:
        raise NotFound('Message not found')

    if request.user != message.user:
        raise PermissionDenied('You can only update your own messages')

    serializer = MessageUpdateSerializer(message, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    message = serializer.save()

    return Response(MessageSerializer(message, context={'request': request}).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteMessage(request, pk):
    try:
        message = Message.objects.get(id=pk)
    except Message.DoesNotExist:
        raise NotFound('Message not found')

    if request.user != message.user:
        raise PermissionDenied('You can only delete your own messages')

    message.delete()
    return Response({'detail': 'Message deleted'}, status=status.HTTP_200_OK)


# -------------------- TOPICS --------------------

@api_view(['GET'])
@permission_classes([AllowAny])
def getTopics(request):
    topics = Topic.objects.all()

    q = request.query_params.get('q')
    if q:
        topics = topics.filter(name__icontains=q)

    paginator = PageNumberPagination()
    paginator.page_size = 20
    page = paginator.paginate_queryset(topics, request)
    serializer = TopicSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def getTopic(request, pk):
    try:
        topic = Topic.objects.get(id=pk)
    except Topic.DoesNotExist:
        raise NotFound('Topic not found')

    serializer = TopicSerializer(topic)
    return Response(serializer.data)


# -------------------- PROFILE --------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getMyProfile(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    serializer = ProfileSerializer(profile, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def getProfile(request, pk):
    try:
        profile = Profile.objects.get(user__id=pk)
    except Profile.DoesNotExist:
        raise NotFound('Profile not found')

    serializer = ProfileSerializer(profile, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def updateProfile(request):
    profile, created = Profile.objects.get_or_create(user=request.user)

    serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(ProfileSerializer(profile, context={'request': request}).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def getUserProfile(request, pk):
    try:
        user = User.objects.get(id=pk)
    except User.DoesNotExist:
        raise NotFound('User not found')

    profile, _ = Profile.objects.get_or_create(user=user)
    rooms = Room.objects.filter(host=user)
    messages = Message.objects.filter(user=user)

    return Response({
        'user': PublicUserSerializer(user, context={'request': request}).data,
        'profile': ProfileSerializer(profile, context={'request': request}).data,
        'rooms': RoomSerializer(rooms, many=True, context={'request': request}).data,
        'messages_count': messages.count(),
    })


# -------------------- ADMIN DASHBOARD --------------------

@api_view(['GET'])
@permission_classes([IsSuperUser])
def adminGetStats(request):
    return Response({
        'users_count': User.objects.count(),
        'rooms_count': Room.objects.count(),
        'topics_count': Topic.objects.count(),
        'messages_count': Message.objects.count(),
        'staff_count': User.objects.filter(is_staff=True).count(),
        'superuser_count': User.objects.filter(is_superuser=True).count(),
    })


# ---- Users ----

@api_view(['GET'])
@permission_classes([IsSuperUser])
def adminGetUsers(request):
    users = User.objects.all().order_by('-date_joined')

    q = request.query_params.get('q')
    if q:
        users = users.filter(
            Q(username__icontains=q) | Q(email__icontains=q)
        )

    role = request.query_params.get('role')
    if role == 'superuser':
        users = users.filter(is_superuser=True)
    elif role == 'staff':
        users = users.filter(is_staff=True, is_superuser=False)
    elif role == 'user':
        users = users.filter(is_staff=False, is_superuser=False)

    status_filter = request.query_params.get('status')
    if status_filter == 'active':
        users = users.filter(is_active=True)
    elif status_filter == 'inactive':
        users = users.filter(is_active=False)

    joined_after = request.query_params.get('joined_after')
    if joined_after:
        try:
            users = users.filter(date_joined__date__gte=joined_after)
        except (ValueError, TypeError):
            pass

    joined_before = request.query_params.get('joined_before')
    if joined_before:
        try:
            users = users.filter(date_joined__date__lte=joined_before)
        except (ValueError, TypeError):
            pass

    paginator = PageNumberPagination()
    try:
        page_size = int(request.query_params.get('page_size', 25))
        page_size = max(1, min(page_size, 500))
    except (TypeError, ValueError):
        page_size = 25
    paginator.page_size = page_size
    page = paginator.paginate_queryset(users, request)
    serializer = AdminUserSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsSuperUser])
def adminUpdateUser(request, pk):
    try:
        target = User.objects.get(id=pk)
    except User.DoesNotExist:
        raise NotFound('User not found')

    if target == request.user:
        blocked = {'is_superuser', 'is_staff', 'is_active'} & set(request.data.keys())
        if blocked:
            raise PermissionDenied("You can't change your own role or active status here.")

    serializer = AdminUserUpdateSerializer(target, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(AdminUserSerializer(target, context={'request': request}).data)


@api_view(['DELETE'])
@permission_classes([IsSuperUser])
def adminDeleteUser(request, pk):
    try:
        target = User.objects.get(id=pk)
    except User.DoesNotExist:
        raise NotFound('User not found')

    if target == request.user:
        raise PermissionDenied("You can't delete your own account here.")

    target.delete()
    return Response({'detail': 'User deleted'}, status=status.HTTP_200_OK)


# ---- Rooms ----

@api_view(['GET'])
@permission_classes([IsSuperUser])
def adminGetRooms(request):
    rooms = Room.objects.all()

    q = request.query_params.get('q')
    if q:
        rooms = rooms.filter(
            Q(name__icontains=q) |
            Q(description__icontains=q) |
            Q(topic__name__icontains=q) |
            Q(host__username__icontains=q)
        )

    topic = request.query_params.get('topic')
    if topic:
        rooms = rooms.filter(topic__name__iexact=topic)

    host = request.query_params.get('host')
    if host:
        if str(host).isdigit():
            rooms = rooms.filter(host__id=int(host))
        else:
            rooms = rooms.filter(host__username__iexact=host)

    paginator = PageNumberPagination()
    try:
        page_size = int(request.query_params.get('page_size', 25))
        page_size = max(1, min(page_size, 500))
    except (TypeError, ValueError):
        page_size = 25
    paginator.page_size = page_size
    page = paginator.paginate_queryset(rooms, request)
    serializer = RoomSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsSuperUser])
def adminUpdateRoom(request, pk):
    try:
        room = Room.objects.get(id=pk)
    except Room.DoesNotExist:
        raise NotFound('Room not found')

    serializer = RoomWriteSerializer(room, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    room = serializer.save()

    return Response(RoomSerializer(room, context={'request': request}).data)


@api_view(['DELETE'])
@permission_classes([IsSuperUser])
def adminDeleteRoom(request, pk):
    try:
        room = Room.objects.get(id=pk)
    except Room.DoesNotExist:
        raise NotFound('Room not found')

    room.delete()
    return Response({'detail': 'Room deleted'}, status=status.HTTP_200_OK)


# ---- Topics ----

@api_view(['GET'])
@permission_classes([IsSuperUser])
def adminGetTopics(request):
    topics = Topic.objects.all()

    q = request.query_params.get('q')
    if q:
        topics = topics.filter(name__icontains=q)

    has_rooms = request.query_params.get('has_rooms')
    if has_rooms == 'yes':
        topics = topics.filter(room__isnull=False).distinct()
    elif has_rooms == 'no':
        topics = topics.filter(room__isnull=True)

    paginator = PageNumberPagination()
    try:
        page_size = int(request.query_params.get('page_size', 25))
        page_size = max(1, min(page_size, 500))
    except (TypeError, ValueError):
        page_size = 25
    paginator.page_size = page_size
    page = paginator.paginate_queryset(topics, request)
    serializer = TopicSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([IsSuperUser])
def adminCreateTopic(request):
    serializer = AdminTopicWriteSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    topic = serializer.save()
    return Response(TopicSerializer(topic).data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsSuperUser])
def adminUpdateTopic(request, pk):
    try:
        topic = Topic.objects.get(id=pk)
    except Topic.DoesNotExist:
        raise NotFound('Topic not found')

    serializer = AdminTopicWriteSerializer(topic, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    topic = serializer.save()
    return Response(TopicSerializer(topic).data)


@api_view(['DELETE'])
@permission_classes([IsSuperUser])
def adminDeleteTopic(request, pk):
    try:
        topic = Topic.objects.get(id=pk)
    except Topic.DoesNotExist:
        raise NotFound('Topic not found')

    topic.delete()
    return Response({'detail': 'Topic deleted'}, status=status.HTTP_200_OK)