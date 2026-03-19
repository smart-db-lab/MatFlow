from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("matflow_test", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="workspacemodelregistry",
            name="metrics",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="workspacemodelregistry",
            name="metrics_table",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="workspacemodelregistry",
            name="model_deploy",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="workspacemodelregistry",
            name="y_pred",
            field=models.JSONField(blank=True, default=list),
        ),
    ]

