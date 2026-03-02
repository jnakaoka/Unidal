# from pydantic import BaseModel, ConfigDict
# from datetime import date
# from typing import List, Optional

# class RosterUpsertIn(BaseModel):
#     cliente_id: int
#     obra_id: int
#     data: date
#     member_ids: List[int]

# class RosterCopyFromLastIn(BaseModel):
#     cliente_id: int
#     obra_id: int
#     data: date  # data alvo (ex: hoje)

# class UserMini(BaseModel):
#     id: int
#     name: str
#     email: str
#     model_config = ConfigDict(from_attributes=True)

# class RosterMemberOut(BaseModel):
#     user: UserMini
#     model_config = ConfigDict(from_attributes=True)

# class RosterOut(BaseModel):
#     id: int
#     cliente_id: int
#     obra_id: int
#     data: date
#     leader_user_id: int
#     status: str
#     members: List[RosterMemberOut]
#     model_config = ConfigDict(from_attributes=True)
