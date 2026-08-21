from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from database.database import get_connection
from services.auth_service import verify_access_token

router = APIRouter(prefix="/users", tags=["Users & Cloud Roles"])

security = HTTPBearer(auto_error=False)

class CloudRoleRequest(BaseModel):
    username: str
    cloud: str
    account_name: str
    account_id: str = ""
    cloud_role: str

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