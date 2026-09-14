from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from base.models import Message, Profile, Room, Topic, AppConfig
from django.contrib.auth.models import User


class AppConfigSerializer(ModelSerializer):
    class Meta:
        model = AppConfig
        fields = ['session_timeout_seconds']


class PublicUserSerializer(ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']

    def get_avatar(self, obj):
        request = self.context.get('request')
        try:
            avatar = obj.profile.avatar
        except (Profile.DoesNotExist, AttributeError):
            return None
        if not avatar:
            return None
        url = avatar.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url


class UserSerializer(ModelSerializer):
    avatar = serializers.SerializerMethodField()
    session_timeout_seconds = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'avatar',
            'is_staff', 'is_superuser', 'session_timeout_seconds'
        ]

    def get_avatar(self, obj):
        request = self.context.get('request')
        try:
            avatar = obj.profile.avatar
        except (Profile.DoesNotExist, AttributeError):
            return None
        if not avatar:
            return None
        url = avatar.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def get_session_timeout_seconds(self, obj):
        config = AppConfig.objects.first()
        return config.session_timeout_seconds if config else 300


class RegisterSerializer(ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value.lower()

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password2": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        return user


class ProfileSerializer(ModelSerializer):
    user = PublicUserSerializer(read_only=True)
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'user', 'bio', 'avatar']

    def get_avatar(self, obj):
        request = self.context.get('request')
        if not obj.avatar:
            return None
        url = obj.avatar.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url


class ProfileUpdateSerializer(ModelSerializer):
    class Meta:
        model = Profile
        fields = ['bio', 'avatar']


class TopicSerializer(ModelSerializer):
    room_count = serializers.SerializerMethodField()
    rooms = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = ['id', 'name', 'room_count', 'rooms']

    def get_room_count(self, obj):
        return obj.room_set.count()

    def get_rooms(self, obj):
        return list(obj.room_set.values('id', 'name'))


class RoomMinimalSerializer(ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name']


class RoomSerializer(ModelSerializer):
    host = PublicUserSerializer(read_only=True)
    topic = TopicSerializer(read_only=True)
    participants = PublicUserSerializer(many=True, read_only=True)
    participants_count = serializers.SerializerMethodField()
    messages_count = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = '__all__'
        read_only_fields = ['host', 'participants']

    def get_participants_count(self, obj):
        return obj.participants.count()

    def get_messages_count(self, obj):
        return obj.message_set.count()


class RoomWriteSerializer(ModelSerializer):
    topic = serializers.CharField(max_length=100, required=False, allow_blank=True)
    host = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True,
    )
    participants = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Room
        fields = ['name', 'description', 'topic', 'host', 'participants']

    def validate_name(self, value):
        if value is None:
            return value
        if len(value.strip()) < 3:
            raise serializers.ValidationError('Room name must be at least 3 characters long.')
        return value.strip()

    def validate_topic(self, value):
        if value is None:
            return value
        return value.strip()

    def validate(self, data):
        name = data.get('name')
        topic = data.get('topic')
        if name and topic and name.strip().lower() == topic.strip().lower():
            raise serializers.ValidationError('Room name and topic should not be identical.')

        host = data.get('host', serializers.empty)
        participants = data.get('participants', serializers.empty)
        if host is not serializers.empty and participants is not serializers.empty:
            if host is not None:
                participant_ids = {u.id for u in participants}
                if host.id not in participant_ids:
                    raise serializers.ValidationError({
                        'host': 'Host must be one of the selected participants.'
                    })
        return data

    def create(self, validated_data):
        topic_name = validated_data.pop('topic', None)
        participants = validated_data.pop('participants', None)
        topic = None
        if topic_name:
            topic, _ = Topic.objects.get_or_create(name=topic_name)
        room = Room.objects.create(topic=topic, **validated_data)
        if participants is not None:
            room.participants.set(participants)
            if room.host_id and room.host_id not in {u.id for u in participants}:
                room.participants.add(room.host)
        return room

    def update(self, instance, validated_data):
        topic_name = validated_data.pop('topic', serializers.empty)
        participants = validated_data.pop('participants', serializers.empty)
        host = validated_data.pop('host', serializers.empty)

        if topic_name is not serializers.empty:
            if topic_name:
                topic, _ = Topic.objects.get_or_create(name=topic_name)
                instance.topic = topic
            else:
                instance.topic = None

        if 'name' in validated_data:
            instance.name = validated_data['name']
        if 'description' in validated_data:
            instance.description = validated_data['description']

        if host is not serializers.empty:
            instance.host = host

        instance.save()

        if participants is not serializers.empty:
            instance.participants.set(participants)
            if instance.host_id and not instance.participants.filter(id=instance.host_id).exists():
                instance.host = None
                instance.save(update_fields=['host'])
            elif instance.host_id:
                instance.participants.add(instance.host)

        return instance


class MessageSerializer(ModelSerializer):
    user = PublicUserSerializer(read_only=True)
    room = RoomMinimalSerializer(read_only=True)

    class Meta:
        model = Message
        fields = '__all__'


class MessageWriteSerializer(ModelSerializer):
    class Meta:
        model = Message
        fields = ['room', 'body']

    def validate_body(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Message body cannot be empty.')
        if len(value) > 1000:
            raise serializers.ValidationError('Message is too long (max 1000 characters).')
        return value.strip()


class MessageUpdateSerializer(ModelSerializer):
    class Meta:
        model = Message
        fields = ['body']

    def validate_body(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Message body cannot be empty.')
        if len(value) > 1000:
            raise serializers.ValidationError('Message is too long (max 1000 characters).')
        return value.strip()


# -------------------- ADMIN --------------------

class AdminUserSerializer(ModelSerializer):
    avatar = serializers.SerializerMethodField()
    rooms_count = serializers.SerializerMethodField()
    messages_count = serializers.SerializerMethodField()
    rooms = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'avatar',
            'is_staff', 'is_superuser', 'is_active',
            'date_joined', 'last_login',
            'rooms_count', 'messages_count', 'rooms',
        ]

    def get_avatar(self, obj):
        request = self.context.get('request')
        try:
            avatar = obj.profile.avatar
        except (Profile.DoesNotExist, AttributeError):
            return None
        if not avatar:
            return None
        url = avatar.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def get_rooms_count(self, obj):
        return obj.room_set.count()

    def get_messages_count(self, obj):
        return obj.message_set.count()

    def get_rooms(self, obj):
        return list(obj.room_set.values('id', 'name'))


class AdminUserUpdateSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['is_staff', 'is_superuser', 'is_active']


class AdminTopicWriteSerializer(ModelSerializer):
    class Meta:
        model = Topic
        fields = ['name']

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Topic name cannot be empty.')
        qs = Topic.objects.filter(name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A topic with this name already exists.')
        return value