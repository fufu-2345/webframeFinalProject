from rest_framework import serializers
from .models import SystemUser, eBook , Payment , TransAccount

class CreateTempSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemUser
        fields = ['username', 'email', 'password', 'fullname', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = SystemUser.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            username=validated_data.get('username'),
            fullname=validated_data.get('fullname'),
            role=validated_data.get('role', 'user')
        )
        return user

class EbookSerializer(serializers.ModelSerializer):
    ebooksample = serializers.FileField(required=False)

    class Meta:
        model = eBook
        fields = '__all__'

class PaymentSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')

    class Meta:
        model = Payment
        fields = '__all__'

class TransAccountSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='owner.username')

    class Meta:
        model = TransAccount
        fields = '__all__'