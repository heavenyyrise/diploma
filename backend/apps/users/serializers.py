from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import User

UserModel = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get(self.username_field)
        try:
            user = UserModel.objects.get(**{self.username_field: username})
            if not user.is_active and not user.is_superuser:
                raise serializers.ValidationError(
                    'Подтвердите email. Проверьте почту или запросите письмо повторно.'
                )
        except UserModel.DoesNotExist:
            pass

        data = super().validate(attrs)
        data['id'] = self.user.id
        data['username'] = self.user.username
        data['email'] = self.user.email
        data['first_name'] = self.user.first_name
        data['last_name'] = self.user.last_name
        return data


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        if UserModel.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Пользователь с таким email уже зарегистрирован.')
        return value.lower()

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        email = validated_data['email']
        user = UserModel.objects.create_user(
            username=email,
            email=email,
            first_name=validated_data['name'],
            password=validated_data['password'],
            is_active=False,
        )
        return user


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = UserModel.objects.get(email__iexact=value)
        except UserModel.DoesNotExist:
            raise serializers.ValidationError('Пользователь не найден.')
        if user.is_active:
            raise serializers.ValidationError('Email уже подтверждён.')
        self.context['user'] = user
        return value.lower()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'avatar', 'reply_to_email']
        read_only_fields = ['id']
