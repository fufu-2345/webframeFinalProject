from django.contrib import admin
from django.apps import apps

# ดึง Model ทั้งหมดที่มีในโปรเจกต์มา
models = apps.get_models()

for model in models:
    try:
        # พยายามลงทะเบียนทุก Model
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        # ถ้า Model ไหนถูกลงทะเบียนไปแล้ว (เช่น User ของระบบ) ก็ข้ามไป
        pass