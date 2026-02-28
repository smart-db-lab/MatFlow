# # chatbot/urls.py
# from django.urls import path
# from .views import (
#     MLChatUnifiedView,
#     ChatSessionListCreateView,
#     ChatMessageView,
# )

# urlpatterns = [
#     # High-level ML agent (spec/plan/solve/operator)
#     path("chat/", MLChatUnifiedView.as_view(), name="ml-chat-unified"),

#     # Chat sessions management
#     path("sessions/", ChatSessionListCreateView.as_view(), name="chat-sessions"),
#     path("sessions/<int:session_id>/", ChatMessageView.as_view(), name="chat-session-messages"),
# ]



from django.urls import path
from .views import ChatbotView

urlpatterns = [
    path("chat/", ChatbotView.as_view()),
]
