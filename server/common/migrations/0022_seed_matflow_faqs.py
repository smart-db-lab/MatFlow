from django.db import migrations


FAQ_SEED = [
    {
        "question": "What is Matflow?",
        "answer": "Matflow is a no-code machine learning workspace where you can upload data, run EDA, apply feature engineering, train models, and review outputs from a unified interface.",
        "order": 1,
    },
    {
        "question": "How do I start a new project in Matflow?",
        "answer": "Open the dashboard, click Create Project, give it a name, and then upload your dataset from the Project panel to begin your workflow.",
        "order": 2,
    },
    {
        "question": "Can I use Matflow without writing code?",
        "answer": "Yes. Matflow is built for visual, no-code workflows. Most common ML tasks can be completed through guided UI actions.",
        "order": 3,
    },
    {
        "question": "What file types are supported for dataset upload?",
        "answer": "CSV is supported directly for modeling workflows. You can also use the conversion tools in the Project panel for supported source formats.",
        "order": 4,
    },
    {
        "question": "Where can I find recently used projects?",
        "answer": "In the dashboard workspace, Recent Projects lists your latest projects so you can reopen them quickly.",
        "order": 5,
    },
]


def seed_matflow_faqs(apps, schema_editor):
    FAQ = apps.get_model("common", "FAQ")

    for item in FAQ_SEED:
        FAQ.objects.update_or_create(
            service_key="matflow",
            question=item["question"],
            defaults={
                "answer": item["answer"],
                "order": item["order"],
                "is_active": True,
            },
        )


def unseed_matflow_faqs(apps, schema_editor):
    FAQ = apps.get_model("common", "FAQ")
    questions = [item["question"] for item in FAQ_SEED]
    FAQ.objects.filter(service_key="matflow", question__in=questions).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("common", "0021_alter_supportlogo_options_supportlogo_order"),
    ]

    operations = [
        migrations.RunPython(seed_matflow_faqs, unseed_matflow_faqs),
    ]

