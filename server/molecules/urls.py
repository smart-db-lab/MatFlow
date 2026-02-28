from django.urls import path

from molecules.views.Psi4DFT import Psi4DFTView
from molecules.views.SAScore import SmilesSAScoreView
from molecules.views.generate import SmilesGenerationView, SmilesGenerationStatusView
from molecules.views.iupac import SmilesIupacConvertView, SmilesIupacStatusView
from molecules.views.scaler import ScalerEvaluationView
from molecules.views.structure import SmilesStructureGenerateView, SmilesStructureStatusView, SmilesStructureZipDownloadView
from molecules.views.organic import organic_check_view

urlpatterns = [
    path('smiles-iupac/convert/', SmilesIupacConvertView.as_view(), name='smiles_iupac_convert'),
    path('smiles-iupac/status/<str:task_id>/', SmilesIupacStatusView.as_view(), name='smiles_iupac_status'),
    path("smiles-structure/generate/", SmilesStructureGenerateView.as_view(), name="smiles_struct_generate"),
    path("smiles-structure/status/<str:task_id>/", SmilesStructureStatusView.as_view(), name="smiles_struct_status"),
    path("smiles-structure/download-zip/<str:task_id>/", SmilesStructureZipDownloadView.as_view(), name="smiles_struct_zip"),
    path("smiles-generation/generate/", SmilesGenerationView.as_view(), name="smiles_gen_generate"),
    path("smiles-generation/status/<str:task_id>/", SmilesGenerationStatusView.as_view(), name="smiles_gen_status"),
    path("organic-check/", organic_check_view),
    path('scale-evaluate/', ScalerEvaluationView.as_view(), name='scaler-evaluation'),
    path("smiles-sa-score/", SmilesSAScoreView.as_view(), name="smiles-sa-score"),
    path("smiles-dft/", Psi4DFTView.as_view(), name="psi4-dft"),

]
