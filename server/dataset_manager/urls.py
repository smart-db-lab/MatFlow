from django.urls import path
from . import views

urlpatterns = [
    path('dataset/', views.get_dataset_structure, name='get_dataset_structure'),
    path('upload/', views.upload_file, name='upload_file'),
    path('create-folder/', views.create_folder, name='create_folder'),
    path('create-file/', views.create_file, name='create_file'),
    path('delete/', views.delete_item, name='delete_item'),
    path('read_file/', views.read_file, name='read_file'),  # New route for reading file content
    path('rename/', views.rename_item, name='rename_item'),
    path('fetch_file/', views.fetch_file_as_attachment, name='fetch_file'),


    path("convert-to-csv/", views.convert_to_csv, name="convert_to_csv"),   
    path("load-dataset/", views.load_any_dataset, name="load_any_dataset"),

]