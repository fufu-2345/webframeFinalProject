from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from datetime import timedelta
from django.core.validators import MinValueValidator, MaxValueValidator


class SystemUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("ผู้ใช้งานต้องมีอีเมล")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        return self.create_user(email, password, **extra_fields)


class SystemUser(AbstractUser):
    ROLE_CHOICES = (
        ("author", "นักเขียน"),
        ("user", "ผู้ใช้ทั่วไป"),
        ("admin", "ผู้ดูแลระบบ"),
    )

    userid = models.AutoField(primary_key=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="user")
    fullname = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    # token
    token_balance = models.IntegerField(default=0)

    # ฟิลด์เฉพาะ Author
    idcard = models.CharField(max_length=20, blank=True, null=True)
    expertise = models.TextField(blank=True, null=True)
    author_expire_at = models.DateTimeField(null=True, blank=True)

    objects = SystemUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "fullname"]

    def __str__(self):
        return self.email

    def is_author_active(self):
        if self.role != "author":
            return False
        if not self.author_expire_at:
            return False
        return self.author_expire_at > timezone.now()

    def extend_author(self, days=365):
        now = timezone.now()

        if self.author_expire_at and self.author_expire_at > now:
            self.author_expire_at += timedelta(days=days)
        else:
            self.author_expire_at = now + timedelta(days=days)

        self.role = "author"
        self.save()


class UsageHistory(models.Model):
    ACTION_CHOICES = (
        ("login", "Login"),
        ("logout", "Logout"),
    )
    user = models.ForeignKey(SystemUser, on_delete=models.CASCADE)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.action} at {self.timestamp}"


class eBook(models.Model):
    CATEGORY_CHOICES = (
        ("computer", "คอมพิวเตอร์"),
        ("data_science", "วิทยาศาสตร์ข้อมูล"),
        ("computer_engineering", "วิศวกรรมคอมพิวเตอร์"),
    )
    STATUS_CHOICES = (
        ("Publish", "Publish"),
        ("Unpublish", "Unpublish"),
    )

    ebookid = models.AutoField(primary_key=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    title = models.CharField(max_length=255)
    author = models.ForeignKey(
        SystemUser,
        on_delete=models.CASCADE,
        limit_choices_to={"role": "author"},
        related_name="authored_ebooks",
    )
    ebook_description = models.TextField()
    cover = models.ImageField(upload_to="covers/")
    ebooksample = models.FileField(upload_to="samples/")
    ebooktoken = models.IntegerField()
    publishdate = models.DateField()
    page = models.IntegerField()
    poststatus = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="Unpublish"
    )
    tag = models.CharField(max_length=255, help_text="คั่นด้วยลูกน้ำ (comma)")
    purchased_users = models.ManyToManyField(
        SystemUser, blank=True, related_name="purchased_ebooks"
    )

    def __str__(self):
        return self.title


class Logread(models.Model):
    # เพิ่ม field user เพื่อให้รู้ว่าใครเป็นคนอ่าน (จำเป็นสำหรับการทำรีพอร์ต)
    user = models.ForeignKey(SystemUser, on_delete=models.CASCADE)
    ebookid = models.ForeignKey(eBook, on_delete=models.CASCADE)
    pagenumber = models.IntegerField()
    datetime = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} read {self.ebookid.title} p.{self.pagenumber}"


class Marketshare(models.Model):
    ebookid = models.ForeignKey(eBook, on_delete=models.CASCADE)
    month = models.DateField()
    page = models.IntegerField()
    uread = models.IntegerField(default=0)

    def __str__(self):
        return f"Marketshare: {self.ebookid.title} ({self.month})"


class Payment(models.Model):
    PAYMENT_TYPE_CHOICES = (
        ("subscription", "สมัครนักเขียน"),
        ("topup", "เติม token"),
    )
    STATUS_CHOICES = (
        ("wait", "รอตรวจสอบ"),
        ("received", "ตรวจสอบแล้ว (Received)"),
        ("rejected", "ยกเลิก"),
    )

    user = models.ForeignKey(SystemUser, on_delete=models.CASCADE)
    paymenttype = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES)
    subprice = models.IntegerField(default=1999)
    tokenpaid = models.IntegerField(default=0)
    transdate = models.DateTimeField(auto_now_add=True)
    enddate = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="wait")

    def save(self, *args, **kwargs):
        if not self.enddate:
            current_time = self.transdate if self.transdate else timezone.now()
            self.enddate = current_time + timedelta(hours=24)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Payment {self.id} - {self.user.email}"


class TransAccount(models.Model):
    PAID_TYPE_CHOICES = (
        ("subscription", "สมัครนักเขียน"),
        ("topup", "เติม token"),
        ("buy", "ซื้อ ebook"),
        ("sell", "ขาย ebook"),
    )

    owner = models.ForeignKey(SystemUser, on_delete=models.CASCADE)
    paidtype = models.CharField(max_length=20, choices=PAID_TYPE_CHOICES)
    paidtoken = models.IntegerField(default=0)
    gettoken = models.IntegerField(default=0)
    tokenbalance = models.IntegerField(default=0)
    balance = models.IntegerField(default=0)
    ebook = models.ForeignKey(eBook, on_delete=models.SET_NULL, null=True, blank=True)
    transdate = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(default=timezone.now)
    def save(self, *args, **kwargs):
        # คำนวณยอดเงินบาท (Balance) อัตโนมัติจากโทเค็นคงเหลือ x 50
        self.balance = self.tokenbalance * 50
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Trans {self.id} - {self.owner.email} Bal: {self.tokenbalance} Tk"


class TopupPlan(models.Model):
    name = models.CharField(max_length=100, blank=True)
    price = models.IntegerField(
        validators=[MinValueValidator(100), MaxValueValidator(1000)]
    )
    token = models.IntegerField(validators=[MinValueValidator(0)])
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.token} tokens)"
