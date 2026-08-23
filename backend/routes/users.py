from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Literal

from database.database import get_connection
from services.auth_service import create_user, verify_access_token

router = APIRouter(prefix="/users", tags=["Users & Cloud Roles"])

security = HTTPBearer(auto_error=False)

class CloudRoleRequest(BaseModel):
    username: str
    cloud: str
    account_name: str
    account_id: str = ""
    cloud_role: str


class CreateApplicationUserRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9._-]+$")
    email: str = Field(min_length=5, max_length=254)
    password: str = Field(min_length=8, max_length=128)
    role: Literal["Administrator", "Contributor", "Read Only"] = "Read Only"
    allowed_region: str = Field(default="All approved regions", min_length=2, max_length=100)


class UpdateApplicationUserRequest(BaseModel):
    role: Literal["Administrator", "Contributor", "Read Only"]
    allowed_region: str = Field(min_length=2, max_length=100)


class ResetApplicationUserPasswordRequest(BaseModel):
    password: str = Field(min_length=8, max_length=128)

def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required.")
    user = verify_access_token(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token.")
    return user

@router.get("")
def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "Administrator":
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute("""
            SELECT id, username, email, role, allowed_region, created_at
            FROM users
            ORDER BY id
        """)
        users = cursor.fetchall()
        connection.close()
        return {"users": [dict(user) for user in users]}

    return {"users": [{
        "id": current_user["user_id"],
        "username": current_user["username"],
        "role": current_user["role"],
        "allowed_region": current_user["allowed_region"]
    }]}


@router.post("")
def add_user(request: CreateApplicationUserRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Administrator":
        raise HTTPException(status_code=403, detail="Only administrators can add users.")
    result = create_user(
        username=request.username,
        email=request.email,
        password=request.password,
        role=request.role,
        allowed_region=request.allowed_region,
    )
    if not result["success"]:
        message = "Username or email already exists." if "UNIQUE" in result["message"] else result["message"]
        raise HTTPException(status_code=400, detail=message)
    return result


@router.patch("/{username}")
def update_user(
    username: str,
    request: UpdateApplicationUserRequest,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "Administrator":
        raise HTTPException(status_code=403, detail="Only administrators can update users.")
    if username == current_user["username"] and request.role != "Administrator":
        raise HTTPException(status_code=400, detail="You cannot remove your own administrator role.")
    connection = get_connection()
    cursor = connection.execute(
        "UPDATE users SET role = ?, allowed_region = ? WHERE username = ?",
        (request.role, request.allowed_region, username),
    )
    connection.commit()
    connection.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"success": True, "message": "Application role updated successfully."}


@router.patch("/{username}/password")
def reset_user_password(
    username: str,
    request: ResetApplicationUserPasswordRequest,
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "Administrator":
        raise HTTPException(status_code=403, detail="Only administrators can reset passwords.")

    from services.auth_service import hash_password

    connection = get_connection()
    cursor = connection.execute(
        "UPDATE users SET password_hash = ? WHERE lower(username) = lower(?)",
        (hash_password(request.password), username.strip()),
    )
    connection.commit()
    connection.close()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"success": True, "message": "Temporary password reset successfully."}

@router.get("/{username}/roles")
def get_user_roles(username: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Administrator" and username != current_user["username"]:
        raise HTTPException(status_code=403, detail="You are not authorized to view this user's roles.")

    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("""
        SELECT u.username, u.role AS platform_role, u.allowed_region,
               r.cloud, r.account_name, r.account_id, r.cloud_role
        FROM users u
        LEFT JOIN user_cloud_roles r ON u.id = r.user_id
        WHERE u.username = ?
    """, (username,))
    rows = cursor.fetchall()
    connection.close()

    if not rows:
        raise HTTPException(status_code=404, detail="User not found.")

    return {
        "username": rows[0]["username"],
        "platform_role": rows[0]["platform_role"],
        "allowed_region": rows[0]["allowed_region"],
        "cloud_roles": [{
            "cloud": row["cloud"],
            "account_name": row["account_name"],
            "account_id": row["account_id"],
            "cloud_role": row["cloud_role"]
        } for row in rows if row["cloud"] is not None]
    }

@router.post("/roles")
def assign_cloud_role(request: CloudRoleRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Administrator":
        raise HTTPException(status_code=403, detail="Only administrators can assign cloud roles.")

    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("SELECT id FROM users WHERE username = ?", (request.username,))
    user = cursor.fetchone()
    if not user:
        connection.close()
        raise HTTPException(status_code=404, detail="User not found.")

    user_id = user["id"]
    cursor.execute("""
        SELECT id FROM user_cloud_roles
        WHERE user_id = ? AND cloud = ? AND account_name = ? AND cloud_role = ?
    """, (user_id, request.cloud, request.account_name, request.cloud_role))
    if cursor.fetchone():
        connection.close()
        return {"success": True, "message": "Cloud role already exists."}

    cursor.execute("""
        INSERT INTO user_cloud_roles (user_id, cloud, account_name, account_id, cloud_role)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, request.cloud, request.account_name, request.account_id, request.cloud_role))
    connection.commit()
    connection.close()
    return {"success": True, "message": "Cloud role assigned successfully."}

@router.delete("/roles")
def remove_cloud_role(
    request: CloudRoleRequest,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "Administrator":
        raise HTTPException(
            status_code=403,
            detail="Only administrators can remove cloud roles."
        )

    connection = get_connection()
    cursor = connection.cursor()

    # Find the user
    cursor.execute(
        "SELECT id FROM users WHERE username = ?",
        (request.username,)
    )
    user = cursor.fetchone()

    if not user:
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )

    # Find the exact cloud-role assignment
    cursor.execute("""
        SELECT id
        FROM user_cloud_roles
        WHERE user_id = ?
          AND cloud = ?
          AND account_name = ?
          AND account_id = ?
          AND cloud_role = ?
    """, (
        user["id"],
        request.cloud,
        request.account_name,
        request.account_id,
        request.cloud_role
    ))

    role = cursor.fetchone()

    if not role:
        connection.close()
        raise HTTPException(
            status_code=404,
            detail="Cloud role assignment not found."
        )

    # Delete the exact assignment
    cursor.execute(
        "DELETE FROM user_cloud_roles WHERE id = ?",
        (role["id"],)
    )

    connection.commit()
    connection.close()

    return {
        "success": True,
        "message": "Cloud role removed successfully."
    }


@router.delete("/{username}")
def delete_user(username: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "Administrator":
        raise HTTPException(status_code=403, detail="Only administrators can delete users.")

    normalized_username = username.strip()
    if normalized_username.lower() == current_user["username"].lower():
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")
    if normalized_username.lower() == "admin":
        raise HTTPException(status_code=400, detail="The built-in administrator cannot be deleted.")

    connection = get_connection()
    try:
        user = connection.execute(
            "SELECT id FROM users WHERE lower(username) = lower(?)",
            (normalized_username,),
        ).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
        connection.execute("DELETE FROM user_cloud_roles WHERE user_id = ?", (user["id"],))
        connection.execute("DELETE FROM users WHERE id = ?", (user["id"],))
        connection.commit()
    finally:
        connection.close()

    return {"success": True, "message": "Application user deleted successfully."}
