# core/models/soft_delete.py
from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return super().update(is_deleted=True, deleted_at=timezone.now())

    def hard_delete(self):
        return super().delete()

    def alive(self):
        return self.filter(is_deleted=False)

    def dead(self):
        return self.filter(is_deleted=True)

    def get_or_create(self, defaults=None, **kwargs):
        """
        Custom get_or_create that looks in all_objects.
        If it finds a deleted one, it restores it.
        """
        # 1. Try to find an active one
        obj = self.filter(is_deleted=False, **kwargs).first()
        if obj:
            return obj, False

        # 2. Try to find a deleted one
        obj = self.model.all_objects.filter(is_deleted=True, **kwargs).first()
        if obj:
            obj.restore()
            return obj, False

        # 3. Create a new one
        return super().get_or_create(defaults=defaults, **kwargs)


class SoftDeleteManager(models.Manager):


    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)
    
    def object(self, **kwargs):
        return self.get_queryset().filter(**kwargs)

    def all_with_deleted(self):
        return SoftDeleteQuerySet(self.model, using=self._db)

    def deleted_only(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=True)


class GlobalManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db)


class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = SoftDeleteManager()
    all_objects = GlobalManager()

    class Meta:
        abstract = True

    def _get_update_fields(self, extra_fields=None):
        """Return only fields that actually exist on the model"""
        fields = ["is_deleted", "deleted_at"]

        if extra_fields:
            fields += extra_fields

        model_fields = {f.name for f in self._meta.get_fields() if hasattr(f, "attname")}

        return [f for f in fields if f in model_fields]

    def delete(self, using=None, keep_parents=False):
        """Soft delete single instance"""
        self.is_deleted = True
        self.deleted_at = timezone.now()

        extra = []
        if hasattr(self, "is_active"):
            self.is_active = False
            extra.append("is_active")

        update_fields = self._get_update_fields(extra)

        self.save(update_fields=update_fields)

    def hard_delete(self, using=None, keep_parents=False):
        """Permanent delete"""
        super().delete(using=using, keep_parents=keep_parents)

    def restore(self):
        """Restore soft-deleted instance"""
        self.is_deleted = False
        self.deleted_at = None

        extra = []
        if hasattr(self, "is_active"):
            self.is_active = True
            extra.append("is_active")

        update_fields = self._get_update_fields(extra)

        self.save(update_fields=update_fields)