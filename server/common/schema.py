from drf_spectacular.utils import extend_schema, extend_schema_view



JournalSchema = extend_schema_view(
    list=extend_schema(tags=["Journal"], summary="List all journals"),
    retrieve=extend_schema(tags=["Journal"], summary="Retrieve journal"),
    create=extend_schema(tags=["Journal"], summary="Create journal"),
    update=extend_schema(tags=["Journal"], summary="Update journal"),
    partial_update=extend_schema(tags=["Journal"], summary="Partially update journal"),
    destroy=extend_schema(tags=["Journal"], summary="Delete journal"),
)

ConferenceSchema = extend_schema_view(
    list=extend_schema(tags=["Conference"], summary="List all conferences"),
    retrieve=extend_schema(tags=["Conference"], summary="Retrieve conference"),
    create=extend_schema(tags=["Conference"], summary="Create conference"),
    update=extend_schema(tags=["Conference"], summary="Update conference"),
    partial_update=extend_schema(tags=["Conference"], summary="Partially update conference"),
    destroy=extend_schema(tags=["Conference"], summary="Delete conference"),
)


BookSchema = extend_schema_view(
    list=extend_schema(tags=["Book"], summary="List all books"),
    retrieve=extend_schema(tags=["Book"], summary="Retrieve book"),
    create=extend_schema(tags=["Book"], summary="Create book"),
    update=extend_schema(tags=["Book"], summary="Update book"),
    partial_update=extend_schema(tags=["Book"], summary="Partially update book"),
    destroy=extend_schema(tags=["Book"], summary="Delete book"),
)


PatentSchema = extend_schema_view(
    list=extend_schema(tags=["Patent"], summary="List all patents"),
    retrieve=extend_schema(tags=["Patent"], summary="Retrieve patent"),
    create=extend_schema(tags=["Patent"], summary="Create patent"),
    update=extend_schema(tags=["Patent"], summary="Update patent"),
    partial_update=extend_schema(tags=["Patent"], summary="Partially update patent"),
    destroy=extend_schema(tags=["Patent"], summary="Delete patent"),
)



DatasetSchema = extend_schema_view(
    list=extend_schema(tags=["Dataset"], summary="List all datasets"),
    retrieve=extend_schema(tags=["Dataset"], summary="Retrieve dataset"),
    create=extend_schema(tags=["Dataset"], summary="Create dataset"),
    update=extend_schema(tags=["Dataset"], summary="Update dataset"),
    partial_update=extend_schema(tags=["Dataset"], summary="Partially update dataset"),
    destroy=extend_schema(tags=["Dataset"], summary="Delete dataset"),
)


OurServieceSchema = extend_schema_view(
    list=extend_schema(tags=["OurServiece"], summary="List all OurServieces"),
    retrieve=extend_schema(tags=["OurServiece"], summary="Retrieve OurServiece"),
    create=extend_schema(tags=["OurServiece"], summary="Create OurServiece"),
    update=extend_schema(tags=["OurServiece"], summary="Update OurServiece"),
    partial_update=extend_schema(tags=["OurServiece"], summary="Partially update OurServiece"),
)

HeaderSectionSchema = extend_schema_view(
    list=extend_schema(tags=["HeaderSection"], summary="List all HeaderSections"),
    retrieve=extend_schema(tags=["HeaderSection"], summary="Retrieve HeaderSection"),
    create=extend_schema(tags=["HeaderSection"], summary="Create HeaderSection"),
    update=extend_schema(tags=["HeaderSection"], summary="Update HeaderSection"),
    partial_update=extend_schema(tags=["HeaderSection"], summary="Partially update HeaderSection"),
)

SupportLogoSchema = extend_schema_view(
    list=extend_schema(tags=["SupportLogo"], summary="List all SupportLogos"),
    retrieve=extend_schema(tags=["SupportLogo"], summary="Retrieve SupportLogo"),
    create=extend_schema(tags=["SupportLogo"], summary="Create SupportLogo"),
    update=extend_schema(tags=["SupportLogo"], summary="Update SupportLogo"),
    partial_update=extend_schema(tags=["SupportLogo"], summary="Partially update SupportLogo"),
)

HeroImageSchema = extend_schema_view(
    list=extend_schema(tags=["HeroImage"], summary="List all HeroImages"),
    retrieve=extend_schema(tags=["HeroImage"], summary="Retrieve HeroImage"),
    create=extend_schema(tags=["HeroImage"], summary="Create HeroImage"),
    update=extend_schema(tags=["HeroImage"], summary="Update HeroImage"),
    partial_update=extend_schema(tags=["HeroImage"], summary="Partially update HeroImage"),
)

FAQSchema = extend_schema_view(
    list=extend_schema(tags=["FAQ"], summary="List all FAQs"),
    retrieve=extend_schema(tags=["FAQ"], summary="Retrieve FAQ"),
    create=extend_schema(tags=["FAQ"], summary="Create FAQ"),
    update=extend_schema(tags=["FAQ"], summary="Update FAQ"),
    partial_update=extend_schema(tags=["FAQ"], summary="Partially update FAQ"),
    destroy=extend_schema(tags=["FAQ"], summary="Delete FAQ"),
)

