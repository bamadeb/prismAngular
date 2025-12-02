import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as bootstrap from 'bootstrap';
import { ApiService } from '../../services/api.service';
import { ApiResponse } from '../../models/api-response';
import { AuthService } from '../../services/auth.service';
import { UploadService } from '../../services/upload.service';
import { HttpEventType, HttpEvent } from '@angular/common/http';

interface Planlist {
  id: number;
  plan_name: string;
  end_date: '';
  start_date: '';
  file_name: '';
  file_type: '';
  status: number;
  plan_document_id: '';
}

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plans.html',
  styleUrls: ['./plans.css']

})
export class Plans implements AfterViewInit, OnInit {
  commonApiRes: ApiResponse = {
    statusCode: 0,
    data: [],
    insertedIds: 0
  };

  users: any[] = [];
  planlist: Planlist[] = [];
  plandetailslist: Planlist[] = [];
  planArray: any = {};
  isEditing = false;
  loading = false;
  toastMessage = '';
  toastType: 'success' | 'danger' | 'warning' = 'success';
  private addUserModal: bootstrap.Modal | null = null;
  isAddMode = true; // or false

  constructor(private http: HttpClient, private apiService: ApiService, private auth: AuthService) { }

  ngAfterViewInit() {
    const modalEl = document.getElementById('addUserModal');
    if (modalEl) {
      this.addUserModal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
    }
  }

  ngOnInit() {
    this.loadPlans();
  }

  // ✅ Load Users + Roles + Departments
  loadPlans() {
    this.loading = true;
    const payload = {};
    this.apiService.post<ApiResponse>('prsmPlandetails', payload)
      .subscribe({
        next: (res) => {
          if (res.data) {
            //console.log(res.data);
            this.planlist = (res?.data as any)?.planlist || [];
            this.plandetailslist = (res?.data as any)?.plandetailslist || [];
            this.loading = false;
          } else {
            console.warn('⚠️ No data found:', res);
          }
        },
        error: (err) => {
          console.error('❌ Dashboard load failed:', err);
          //alert('Server error. Please try again later.');
        }
      });
  }
  // ✅ Open Add User Modal
  openAddUserModal() {
    this.isEditing = false;
    this.isHidden = false;
    this.isplanHidden = false;

    this.planArray = {
      plan_name: '',
      start_date: '',
      end_date: '',
      plan_id: '',
      file_name: '',
      status: '0', plan_document_id: '',
    };
    this.addUserModal?.show();
  }

  isHidden = false;
  // ✅ Open Edit User Modal - Fetch full user details from API
  openEditUserModal(userData: any) {
    this.isEditing = true;
    this.loading = true;
    //console.log(userData);
    this.isHidden = true;
    this.isplanHidden = false;
    // ✅ Fill form with API response
    this.planArray = {
      id: userData.id,
      file_name: '',
      plan_name: userData.plan_name || '',
      start_date: userData.start_date || '',
      end_date: userData.end_date || '',
      status: userData.status,
      plan_document_id: userData.plan_document_id
    };
    this.addUserModal?.show();
  }

  isplanHidden = false;
  onPlanChange(plan_id: any) {
    //alert(plan_id);
    if (plan_id) {
      this.isplanHidden = true;
    } else {
      this.isplanHidden = false;
    }
  }

    // ✅ Close Modal
  closeAddUserModal() {
    this.addUserModal?.hide();
    this.loadPlans();
  }

  selectedFile: File | null = null;
  uploadedFileName: string = '';
  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }


  // ✅ Add User Flow
  async  addPlan(form: NgForm) {
    if (!form.valid) return;

    const file = this.selectedFile;
    if (!file) return alert("No file selected");
    //console.log(this.planArray.status);
    this.loading = true;
    const filestatus = this.planArray.status;

    if (this.planArray.plan_id) {          
      // upload file to s3 sever       
        await this.fileupload(this.planArray.plan_id,filestatus);
         form.resetForm();   
           
    } else {
      const insertData = {
        plan_name: this.planArray.plan_name,
        start_date: this.planArray.start_date,
        end_date: this.planArray.end_date
      };
      const payload = {
        table_name: "MEM_PLAN_MASTER",
        insertDataArray: [insertData]
      };
      
      this.apiService.post<ApiResponse>('prismMultipleinsert', payload)
        .subscribe({
          next: (res) => {            
            // S3 file upload function
            this.fileupload(res.insertedIds,filestatus); 
             form.resetForm();            
          },
          error: (err) => {
            this.loading = false;
            console.error(err);
            this.showToast('Error adding plan.', 'danger');
          }
        });
      }    
      form.resetForm();  
  }

  // ✅ Update User Flow 
  async updatePlan(form: NgForm) {
    if (!form.valid) return;
    this.loading = true;
    this.isAddMode = false; 
    console.log(this.planArray);


    const updateData = {
      plan_name: this.planArray.plan_name,
      start_date: this.planArray.start_date,
      end_date: this.planArray.end_date
    };

    const payload = {
      updateData,
      table_name: 'MEM_PLAN_MASTER',
      id_field_name: 'id',
      id_field_value: this.planArray.id
    };
    this.apiService.post<ApiResponse>('prismMultiplefieldupdate', payload)
      .subscribe({
        next: (res: any) => {
          //console.log('✅ Update Response:', res);
          this.loading = false;
          if (res?.statusCode === 200) {
            
            // update plan document status
            this.updateplanstatus();
            form.resetForm();    

          } else {
            this.showToast('Failed to update plan.', 'danger');
          }
        },
        error: (err) => {
          console.error('❌ Update failed:', err);
          this.loading = false;
          this.showToast('Error updating plan.', 'danger');
        }
      });
  }

  updateplanstatus(){
    const updateplandetailsData = {
      status: this.planArray.status 
    };

    const payload1 = {
      updateData: updateplandetailsData,
      table_name: 'MEM_PLAN_DOCUMENTS',
      id_field_name: 'id',
      id_field_value: this.planArray.plan_document_id
    }; 

    this.apiService.post<ApiResponse>('prismMultiplefieldupdate', payload1)
      .subscribe({
        next: (res: any) => {
          if (this.selectedFile) {
              this.fileupload(this.planArray.plan_id,this.planArray.status);                
          }
          
          //this.loadPlans();
          this.loading = false;
          this.closeAddUserModal(); 
          this.showToast('Plan updated successfully.', 'success');
         },
        error: (err) => {
          console.error('❌ Update failed:', err);
          this.loading = false;
          this.showToast('Error updating plan document.', 'danger');
        }
      });
  }

  fileupload(plan_id: number,documentstatus:number) {
   
    const file = this.selectedFile;
    if (!file) return alert("No file selected");

    const payload = {
      fileName: file.name,
      fileType: file.type,
      plan_id: plan_id
    }; 
    //console.log('filestatus: '+documentstatus);
    this.apiService.post<any>('prismUploadplandocument', payload)
      .subscribe({
        next: async (res) => {  
          const parsed = JSON.parse(res.body);
          const uploadUrl = parsed.uploadUrl; 
          const upload = await fetch(uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type
            }
          });           

          if (upload.ok) {
            console.log("File uploaded successfully!"); 
            if(this.isAddMode){
              this.saveFileUrlToDB(plan_id, parsed.fileUrl,documentstatus);
            }else{
              this.updateFileUrlToDB(this.planArray.plan_document_id, parsed.fileUrl,documentstatus);
            }
            
          } else {
            console.error("S3 Upload Error:", upload);
            alert("Plan document upload failed!");
          }
        },
        error: (err) => {
          console.error("Lambda Error:", err);
          alert("Could not get upload URL");
        }
      });
  }

  updateFileUrlToDB(plan_document_id: number, fileUrl: string,filestatus:number) { 
    const updateplandetailsData = {
      file_name: fileUrl
    };

    const payload1 = {
      updateData: updateplandetailsData,
      table_name: 'MEM_PLAN_DOCUMENTS',
      id_field_name: 'id',
      id_field_value: plan_document_id
    }; 

    this.apiService.post<ApiResponse>('prismMultiplefieldupdate', payload1)
      .subscribe({
        next: (res: any) => { 
          this.loadPlans();
          //this.closeAddUserModal();     
        },
        error: (err) => {
          console.error('❌ Update failed:', err);
          this.loading = false;
          this.showToast('Error updating plan document.', 'danger');
        }
      });
  }

  saveFileUrlToDB(plan_id: number, fileUrl: string,filestatus:number) { 
    const user = this.auth.getUser();
    const added_by = user?.ID || 0;
    const insertdetailsData = {
      plan_id: plan_id,
      file_name: fileUrl,
      file_type: '',
      added_by: added_by,
      status: filestatus
    };

    console.log(insertdetailsData);

    const payloadDocument = {
      table_name: "MEM_PLAN_DOCUMENTS",
      insertDataArray: [insertdetailsData]
    };

    this.apiService.post<ApiResponse>('prismMultipleinsert', payloadDocument).subscribe({
      next: (res: any) => {
        this.loadPlans();
        this.closeAddUserModal();   
        this.loading = false;
        this.showToast('Plan added successfully.', 'success');
      },
      error: (err) => {
        console.error('❌ Update failed:', err);
        this.loading = false;
        //this.showToast('Error updating plan details.', 'danger');
      }
    });
  } 

  // ✅ Toast Message
  showToast(message: string, type: 'success' | 'danger' | 'warning' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => (this.toastMessage = ''), 3000);
  }
}