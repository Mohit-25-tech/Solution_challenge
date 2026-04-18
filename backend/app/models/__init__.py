from app.models.models import (
    User,
    Volunteer,
    Request,
    Assignment,
    Notification,
    AuditLog,
)

# String constant aliases for backward compatibility
UserRole = type("UserRole", (), {"ngo": "ngo", "volunteer": "volunteer", "admin": "admin"})
RequestType = type("RequestType", (), {
    "medical": "medical", "food": "food", "rescue": "rescue",
    "construction": "construction", "logistics": "logistics", "counseling": "counseling"
})
RequestStatus = type("RequestStatus", (), {
    "pending": "pending", "assigned": "assigned",
    "completed": "completed", "cancelled": "cancelled"
})
AssignmentStatus = type("AssignmentStatus", (), {
    "assigned": "assigned", "accepted": "accepted",
    "rejected": "rejected", "completed": "completed", "expired": "expired"
})

__all__ = [
    "User",
    "Volunteer",
    "Request",
    "Assignment",
    "Notification",
    "AuditLog",
    "UserRole",
    "RequestType",
    "RequestStatus",
    "AssignmentStatus",
]
