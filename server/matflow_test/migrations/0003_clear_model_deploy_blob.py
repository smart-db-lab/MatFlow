from django.db import migrations


def clear_model_deploy(apps, schema_editor):
    WorkspaceModelRegistry = apps.get_model("matflow_test", "WorkspaceModelRegistry")
    WorkspaceModelRegistry.objects.exclude(model_deploy="").update(model_deploy="")


class Migration(migrations.Migration):
    dependencies = [
        ("matflow_test", "0002_workspacemodelregistry_payload_fields"),
    ]

    operations = [
        migrations.RunPython(clear_model_deploy, migrations.RunPython.noop),
    ]

