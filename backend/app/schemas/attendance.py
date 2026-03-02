# from pydantic import BaseModel, ConfigDict
# from typing import List, Optional
# from datetime import datetime

# class AttendanceSessionCreateIn(BaseModel):
#     roster_id: int
#     start_lat: Optional[float] = None
#     start_lng: Optional[float] = None
#     start_accuracy: Optional[float] = None
#     started_at_device: Optional[datetime] = None

# class AttendanceSessionCloseIn(BaseModel):
#     end_lat: Optional[float] = None
#     end_lng: Optional[float] = None
#     end_accuracy: Optional[float] = None
#     ended_at_device: Optional[datetime] = None

# class AttendanceCheckOut(BaseModel):
#     id: int
#     user_id: int
#     photo_url: str
#     result: str
#     model_config = ConfigDict(from_attributes=True)

# class AttendanceSessionOut(BaseModel):
#     id: int
#     roster_id: int
#     leader_user_id: int
#     status: str
#     started_at: datetime
#     ended_at: Optional[datetime] = None
#     checks: List[AttendanceCheckOut] = []
#     model_config = ConfigDict(from_attributes=True)
