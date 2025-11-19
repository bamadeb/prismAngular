import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as bootstrap from 'bootstrap';

interface Role {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}


@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class Users implements AfterViewInit, OnInit {


  private apiurl = "https://e9vakopr4c.execute-api.us-east-1.amazonaws.com/dev/";
  private env = 'dev';
  //private apiurl = "https://yeuovejy1b.execute-api.us-east-2.amazonaws.com/prod";
  //private env = 'prod';

  private usersListUrl = this.apiurl+'/prismUserslist-'+this.env;
  private authUrl = this.apiurl+'/prismAuthentication-'+this.env;
  private insertUrl = this.apiurl+'/prismMultipleinsert-'+this.env;
  private updateUrl = this.apiurl+'/prismMultiplefieldupdate-'+this.env;
  private userByIdUrl = this.apiurl+'/prismUserListByRole-'+this.env;


  users: any[] = [];
  roles: Role[] = [];
  departments: Department[] = [];
  
  newUser: any = {};
  showPassword = false;
  searchTerm = '';
  isEditing = false;
  loading = false;

  toastMessage = '';
  toastType: 'success' | 'danger' | 'warning' = 'success';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  private addUserModal: bootstrap.Modal | null = null;

  constructor(private http: HttpClient) {}

  ngAfterViewInit() {
    const modalEl = document.getElementById('addUserModal');
    if (modalEl) {
      this.addUserModal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
    }
  }

  ngOnInit() {
    this.loadUsers();
  }

// ✅ Load Users + Roles + Departments
loadUsers() {
  this.loading = true;
  const headers = { 'Content-Type': 'application/json' };

  this.http.post<any>(this.usersListUrl, {}, { headers }).subscribe({
    next: (res: any) => {
      console.log('✅ Users API Response:', res);
      const data = res?.data || {};

      const departmentList = Array.isArray(data.department)
        ? data.department.map((d: any) => ({
            id: d.id,
            name: (d.department || '').trim(),
          }))
        : [];

      const roleList = Array.isArray(data.roles)
        ? data.roles.map((r: any) => ({
            id: r.ID,
            name: (r.ROLE_NAME || '').trim(),
          }))
        : [];

      this.departments = departmentList;
      this.roles = roleList;

      // ✅ Users mapping
      this.users = (data.users || []).map((u: any) => {
        const deptMatch = departmentList.find(
          (d: any) =>
            d.name.toLowerCase() === (u.department || '').toLowerCase()
        );

        return {
          ID: u.ID,
          firstName: u.FistName || '',
          lastName: u.LastName || '',
          email: u.EmailID || '',
          department: deptMatch ? deptMatch.name : (u.department || '—'),
          departmentId: deptMatch?.id || null,
          role: u.ROLE_NAME || '-',
          roleId: u.role_id || null,
          status:
            u.status ||
            (u.member_status === 1 ? 'Inactive' : 'Active'),
        };
      });

      this.loading = false;
      //this.showToast('Users loaded successfully', 'success');
    },
    error: (err) => {
      console.error('❌ Failed to load users:', err);
      this.loading = false;
      this.showToast('Failed to load users', 'danger');
    },
  });
}

  // ✅ Open Add User Modal
  openAddUserModal() {
    this.isEditing = false;
    this.newUser = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: null,
      department: null,
      status: '0'
    };
    this.addUserModal?.show();
  }

// ✅ Open Edit User Modal - Fetch full user details from API
openEditUserModal(user: any) {
  this.isEditing = true;
  this.showPassword = false;
  this.loading = true;

  const payload = { user_id: user.ID };

  this.http.post<any>(this.userByIdUrl, payload).subscribe({
    next: (res) => {
      this.loading = false;
      const userData = res?.data?.[0];

      if (!userData) {
        this.showToast('User details not found.', 'warning');
        return;
      }

      // ✅ Normalize status (0 = Active, 1 = Inactive)
      const normalizedStatus = userData.member_status === 0 ? 0 : 1;

      // ✅ Fill form with API response
      this.newUser = {
        id: userData.ID,
        firstName: userData.FistName || '',
        lastName: userData.LastName || '',
        email: userData.EmailID || '',
        password: userData.Password || '', // show real password
        role: this.roles.find(r => r.id === userData.role_id)?.id || null,
        department: this.departments.find(d => d.id === userData.department_id)?.id || null,
        status: normalizedStatus
      };

      this.addUserModal?.show();
    },
    error: (err) => {
      this.loading = false;
      console.error('❌ Failed to load user details:', err);
      this.showToast('Failed to load user details.', 'danger');
    }
  });
}    

  // ✅ Add User Flow
  addUser(form: NgForm) {
    if (!form.valid) return;

    this.loading = true;

    // Step 1: Check if Email Exists
    const emailCheckPayload = { username: this.newUser.email };

    this.http.post<any>(this.authUrl, emailCheckPayload).subscribe({
      next: (authRes: any) => {
        const exists = authRes?.data && Array.isArray(authRes.data) && authRes.data.length > 0;

        if (exists) {
          this.loading = false;
          //this.showToast('Username already exists.', 'warning');
        } else {
          // Step 2: Proceed to Insert User
          this.insertUser(form);
        }
      },
      error: (err) => {
        console.error('❌ Email check failed:', err);
        this.loading = false;
        this.showToast('Failed to check email.', 'danger');
      }
    });
  }

// ✅  Add New user Insert Flow 
private insertUser(form: NgForm) {
  const selectedDept = this.departments.find(d => d.id == this.newUser.department);
  const insertData = {
    FistName: this.newUser.firstName,
    LastName: this.newUser.lastName,
    role_id: this.newUser.role,
    EmailID: this.newUser.email,
    Password: this.newUser.password,
    member_status: this.newUser.status,

    department_id: selectedDept ? selectedDept.id : null   // ✅ department id, not ID
  };
//  console.log('🟡 Insert Data:', insertData);
  const payload = {
    table_name: 'MEM_USERS',
    insertDataArray: [insertData]
  };

  this.http.post<any>(this.insertUrl, payload).subscribe({
    next: (res: any) => {
      console.log('✅ Insert Response:', res);
      this.loading = false;
      if (res?.status === 'success' || res?.message?.toLowerCase().includes('success')) {
        this.showToast('User added successfully.', 'success');
        this.loadUsers();
        this.closeAddUserModal();
        form.resetForm();
      } else {
        this.showToast('Failed to add user.', 'danger');
      }
    },
    error: (err) => {
      console.error('❌ Insert failed:', err);
      this.loading = false;
      this.showToast('Error adding user.', 'danger');
    }
  });
}

// ✅ Update User Flow 
updateUser(form: NgForm) {
  if (!form.valid) return;
  this.loading = true;

  const selectedDept = this.departments.find(d => d.id == this.newUser.department);

  const updateData = {
    FistName: this.newUser.firstName,
    LastName: this.newUser.lastName,
    role_id: Number(this.newUser.role),
    member_status: Number(this.newUser.status), 
    department_id: selectedDept ? selectedDept.id : null
  };
  

  const payload = {
    updateData,
    table_name: 'MEM_USERS',
    id_field_name: 'ID',
    id_field_value: this.newUser.id
  };

  console.log('🟡 Update Payload:', payload);

  this.http.post<any>(this.updateUrl, payload).subscribe({
    next: (res: any) => {
      console.log('✅ Update Response:', res);
      this.loading = false;
      if (res?.statusCode === 200) {
        this.showToast('User updated successfully.', 'success');
        this.loadUsers();
        this.closeAddUserModal();
      } else {
        this.showToast('Failed to update user.', 'danger');
      }
    },
    error: (err) => {
      console.error('❌ Update failed:', err);
      this.loading = false;
      this.showToast('Error updating user.', 'danger');
    }
  });
}
  
  // ✅ Close Modal
  closeAddUserModal() {
    this.addUserModal?.hide();
  }

  // ✅ Table Sorting
  sortTable(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.users.sort((a, b) => {
      const valueA = (a[column] ?? '').toString().toLowerCase();
      const valueB = (b[column] ?? '').toString().toLowerCase();

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ✅ Filter + Sort
  filteredUsers() {
    let filtered = this.users.filter(user =>
      Object.values(user)
        .join(' ')
        .toLowerCase()
        .includes(this.searchTerm?.toLowerCase() || '')
    );

    if (this.sortColumn) {
      filtered.sort((a, b) => {
        const valueA = (a[this.sortColumn] ?? '').toString().toLowerCase();
        const valueB = (b[this.sortColumn] ?? '').toString().toLowerCase();

        if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }

  // ✅ Toggle Password
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  // ✅ Toast Message
  showToast(message: string, type: 'success' | 'danger' | 'warning' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => (this.toastMessage = ''), 3000);
  }
}