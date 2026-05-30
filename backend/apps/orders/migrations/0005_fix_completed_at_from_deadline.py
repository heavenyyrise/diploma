from datetime import datetime, time

from django.db import migrations
from django.utils import timezone


def fix_completed_at_from_deadline(apps, schema_editor):
    Order = apps.get_model('orders', 'Order')
    today = timezone.localdate()
    tz = timezone.get_current_timezone()

    for order in Order.objects.filter(status='completed', deadline__lt=today).exclude(deadline__isnull=True):
        naive = datetime.combine(order.deadline, time(12, 0))
        order.completed_at = timezone.make_aware(naive, tz)
        order.save(update_fields=['completed_at'])


class Migration(migrations.Migration):
    dependencies = [
        ('orders', '0004_orderattachment'),
    ]

    operations = [
        migrations.RunPython(fix_completed_at_from_deadline, migrations.RunPython.noop),
    ]
