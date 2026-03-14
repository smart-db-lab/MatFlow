# Generated migration for pfs.Project.owner related_name change

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('pfs', '0002_project_is_favorite'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='owner',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pfs_projects', to=settings.AUTH_USER_MODEL),
        ),
    ]
