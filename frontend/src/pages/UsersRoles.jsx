import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  assignUserCloudRole, createUser, deleteUser, getUserRoles, getUsers,
  removeUserCloudRole, resetUserPassword, updateUser,
} from "../services/api";

const PLATFORM_ROLES = ["Administrator", "Contributor", "Read Only"];
const emptyUser = { username: "", email: "", password: "", role: "Read Only", allowed_region: "All approved regions" };
const emptyCloudRole = { cloud: "Azure", account_name: "", account_id: "", cloud_role: "Reader" };
const errorMessage = (error, fallback) => error?.response?.data?.detail || fallback;

function UsersRoles() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState(emptyUser);
  const [selectedUser, setSelectedUser] = useState(null);
  const [cloudRole, setCloudRole] = useState(emptyCloudRole);
  const [temporaryPassword, setTemporaryPassword] = useState("");

  let currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem("currentUser") || "null"); } catch { currentUser = null; }
  const isAdministrator = currentUser?.role === "Administrator";

  const loadUsers = async () => {
    setLoading(true);
    try { setUsers((await getUsers()).users || []); }
    catch (error) { setNotice({ severity: "error", text: errorMessage(error, "Unable to load users.") }); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const openManage = async (username) => {
    setNotice(null);
    try {
      setSelectedUser(await getUserRoles(username));
      setCloudRole(emptyCloudRole);
      setTemporaryPassword("");
      setManageOpen(true);
    } catch (error) { setNotice({ severity: "error", text: errorMessage(error, "Unable to load roles.") }); }
  };

  const submitUser = async () => {
    setSaving(true);
    try {
      await createUser(newUser);
      setAddOpen(false); setNewUser(emptyUser);
      setNotice({ severity: "success", text: "Application user created successfully." });
      await loadUsers();
    } catch (error) { setNotice({ severity: "error", text: errorMessage(error, "Unable to create user.") }); }
    finally { setSaving(false); }
  };

  const savePlatformRole = async () => {
    setSaving(true);
    try {
      await updateUser(selectedUser.username, { role: selectedUser.platform_role, allowed_region: selectedUser.allowed_region });
      setNotice({ severity: "success", text: "Application role updated successfully." });
      await loadUsers();
    } catch (error) { setNotice({ severity: "error", text: errorMessage(error, "Unable to update user.") }); }
    finally { setSaving(false); }
  };

  const addCloudRole = async () => {
    setSaving(true);
    try {
      await assignUserCloudRole({ username: selectedUser.username, ...cloudRole });
      setSelectedUser(await getUserRoles(selectedUser.username));
      setCloudRole(emptyCloudRole);
      setNotice({ severity: "success", text: "Application cloud-role mapping added." });
    } catch (error) { setNotice({ severity: "error", text: errorMessage(error, "Unable to assign cloud role.") }); }
    finally { setSaving(false); }
  };

  const removeCloudRole = async (role) => {
    setSaving(true);
    try {
      await removeUserCloudRole({ username: selectedUser.username, ...role });
      setSelectedUser(await getUserRoles(selectedUser.username));
      setNotice({ severity: "success", text: "Application cloud-role mapping removed." });
    } catch (error) { setNotice({ severity: "error", text: errorMessage(error, "Unable to remove cloud role.") }); }
    finally { setSaving(false); }
  };

  const resetPassword = async () => {
    setSaving(true);
    try {
      await resetUserPassword(selectedUser.username, temporaryPassword);
      setTemporaryPassword("");
      setNotice({ severity: "success", text: `Temporary password reset for ${selectedUser.username}.` });
    } catch (error) { setNotice({ severity: "error", text: errorMessage(error, "Unable to reset password.") }); }
    finally { setSaving(false); }
  };

  const removeUser = async (username) => {
    if (!window.confirm(`Delete application user “${username}”? This also removes their application cloud-role mappings.`)) return;
    setSaving(true);
    try {
      await deleteUser(username);
      setManageOpen(false); setSelectedUser(null);
      setNotice({ severity: "success", text: `Application user ${username} deleted.` });
      await loadUsers();
    } catch (error) { setNotice({ severity: "error", text: errorMessage(error, "Unable to delete user.") }); }
    finally { setSaving(false); }
  };

  return <Box>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} mb={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>Users & Cloud Roles</Typography>
        <Typography color="text.secondary">Application access and descriptive cloud-role mappings. Cloud permissions remain enforced by Azure DevOps and the cloud provider.</Typography>
      </Box>
      {isAdministrator && <Button variant="contained" onClick={() => setAddOpen(true)}>Add user</Button>}
    </Stack>

    {notice && <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={{ mb: 2 }}>{notice.text}</Alert>}
    <TableContainer component={Paper}><Table>
      <TableHead><TableRow><TableCell><strong>User</strong></TableCell><TableCell><strong>Email</strong></TableCell><TableCell><strong>Platform Role</strong></TableCell><TableCell><strong>Region Scope</strong></TableCell><TableCell align="right"><strong>Actions</strong></TableCell></TableRow></TableHead>
      <TableBody>{loading ? <TableRow><TableCell colSpan={5}>Loading users...</TableCell></TableRow> : users.map((user) => <TableRow key={user.id} hover>
        <TableCell>{user.username}</TableCell><TableCell>{user.email || "-"}</TableCell><TableCell><Chip label={user.role} size="small" /></TableCell><TableCell>{user.allowed_region || "All approved regions"}</TableCell>
        <TableCell align="right"><Button variant="outlined" size="small" onClick={() => openManage(user.username)}>{isAdministrator ? "Manage roles" : "View roles"}</Button></TableCell>
      </TableRow>)}</TableBody>
    </Table></TableContainer>

    <Dialog open={addOpen} onClose={() => !saving && setAddOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Add application user</DialogTitle><DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>This creates an application login only. It does not create an Azure, AWS or Azure DevOps identity.</Alert>
        <Stack spacing={2} mt={1}>
          <TextField label="Username" required value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
          <TextField label="Email" type="email" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <TextField label="Temporary password" type="password" required helperText="Minimum 8 characters" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          <TextField select label="Platform role" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>{PLATFORM_ROLES.map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}</TextField>
          <TextField label="Allowed region" value={newUser.allowed_region} onChange={(e) => setNewUser({ ...newUser, allowed_region: e.target.value })} />
        </Stack>
      </DialogContent><DialogActions><Button onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button><Button variant="contained" onClick={submitUser} disabled={saving || !newUser.username || !newUser.email || newUser.password.length < 8}>Create user</Button></DialogActions>
    </Dialog>

    <Dialog open={manageOpen} onClose={() => !saving && setManageOpen(false)} fullWidth maxWidth="md">
      <DialogTitle>{isAdministrator ? "Manage roles" : "Role details"}{selectedUser ? ` — ${selectedUser.username}` : ""}</DialogTitle>
      {selectedUser && <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>Cloud-role mappings are application metadata only. Azure DevOps service connections and cloud IAM remain the final authorization controls.</Alert>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={3}>
          <TextField select fullWidth label="Platform role" disabled={!isAdministrator} value={selectedUser.platform_role} onChange={(e) => setSelectedUser({ ...selectedUser, platform_role: e.target.value })}>{PLATFORM_ROLES.map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}</TextField>
          <TextField fullWidth label="Allowed region" disabled={!isAdministrator} value={selectedUser.allowed_region || "All approved regions"} onChange={(e) => setSelectedUser({ ...selectedUser, allowed_region: e.target.value })} />
          {isAdministrator && <Button variant="contained" onClick={savePlatformRole} disabled={saving}>Save</Button>}
        </Stack>
        {isAdministrator && selectedUser.username.toLowerCase() !== "admin" && <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>Account access</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-start" }}>
            <TextField fullWidth label="New temporary password" type="password" helperText="Minimum 8 characters; share it securely" value={temporaryPassword} onChange={(e) => setTemporaryPassword(e.target.value)} />
            <Button variant="outlined" onClick={resetPassword} disabled={saving || temporaryPassword.length < 8} sx={{ minWidth: 150, mt: { sm: .5 } }}>Reset password</Button>
            {selectedUser.username !== currentUser?.username && <Button color="error" variant="outlined" onClick={() => removeUser(selectedUser.username)} disabled={saving} sx={{ minWidth: 125, mt: { sm: .5 } }}>Delete user</Button>}
          </Stack>
        </Paper>}
        <Typography variant="h6" gutterBottom>Cloud access mappings</Typography>
        {selectedUser.cloud_roles.length === 0 && <Typography color="text.secondary" mb={2}>No cloud roles assigned.</Typography>}
        <Stack spacing={1} mb={3}>{selectedUser.cloud_roles.map((role) => <Paper variant="outlined" sx={{ p: 1.5 }} key={`${role.cloud}-${role.account_name}-${role.cloud_role}`}><Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={1}>
          <Box><strong>{role.cloud}</strong> · {role.account_name} {role.account_id ? `(${role.account_id})` : ""} · <Chip label={role.cloud_role} size="small" /></Box>
          {isAdministrator && <Button color="error" size="small" onClick={() => removeCloudRole(role)} disabled={saving}>Remove</Button>}
        </Stack></Paper>)}</Stack>
        {isAdministrator && <Box><Typography variant="subtitle1" fontWeight={700} gutterBottom>Add cloud-role mapping</Typography><Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
          <TextField select label="Cloud" value={cloudRole.cloud} onChange={(e) => setCloudRole({ ...cloudRole, cloud: e.target.value, cloud_role: e.target.value === "Azure" ? "Reader" : "ReadOnlyAccess" })} sx={{ minWidth: 120 }}><MenuItem value="Azure">Azure</MenuItem><MenuItem value="AWS">AWS</MenuItem></TextField>
          <TextField label={cloudRole.cloud === "Azure" ? "Subscription name" : "Account name"} required value={cloudRole.account_name} onChange={(e) => setCloudRole({ ...cloudRole, account_name: e.target.value })} />
          <TextField label={cloudRole.cloud === "Azure" ? "Subscription ID" : "Account ID"} value={cloudRole.account_id} onChange={(e) => setCloudRole({ ...cloudRole, account_id: e.target.value })} />
          <TextField label="Role label" required value={cloudRole.cloud_role} onChange={(e) => setCloudRole({ ...cloudRole, cloud_role: e.target.value })} />
          <Button variant="outlined" onClick={addCloudRole} disabled={saving || !cloudRole.account_name || !cloudRole.cloud_role}>Add</Button>
        </Stack></Box>}
      </DialogContent>}
      <DialogActions><Button onClick={() => setManageOpen(false)}>Close</Button></DialogActions>
    </Dialog>
  </Box>;
}

export default UsersRoles;
