import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm,FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as bootstrap from 'bootstrap';
import { ApiService } from '../../services/api.service';
import { ApiResponse } from '../../models/api-response';
import { AuthService } from '../../services/auth.service';
import { UploadService } from '../../services/upload.service';
import { HttpEventType, HttpEvent } from '@angular/common/http';
import { environment } from '../../../environments/environment';


interface Planlist {
  id: number;
  plan_name: string;
  end_date: '';
  start_date: '';
  file_name: '';
  file_type: '';
  status: number;
  docstatus: number;
  plan_document_id: '';
}
declare var $: any;
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
 
   addPlanFormGroup!:FormGroup;

  constructor(private http: HttpClient, private apiService: ApiService, private auth: AuthService) { }

  ngAfterViewInit() {
   setTimeout(() => {
      $('.datepicker').datepicker({
        format: 'mm/dd/yyyy',
        autoclose: true,
        todayHighlight: true, 
        container: 'body'
      }).on('changeDate', (e: any) => {   // ← ARROW FUNCTION (no "this" issue)

          const selectedDate = e.format('mm/dd/yyyy');   // selected date
          const inputName = e.target.getAttribute('name'); // get field name

          if (inputName && this.planArray.hasOwnProperty(inputName)) {
            this.planArray[inputName] = selectedDate;     // dynamic patching!
          }

      });
    }, 200);



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
            this.planlist = (res?.data as any)?.plist || [];
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
    this.isAddMode = false;
    
    $('#file_name').val('');

    this.planArray = {
      plan_name: '',
      start_date: '',
      end_date: '',
      plan_id: '',
      file_name: '',
      status: '',docstatus: '', plan_document_id: '',
    };
    
    this.addUserModal?.show();
  }

  

  isHidden = false;
  // ✅ Open Edit User Modal - Fetch full user details from API
  openEditUserModal(userData: any) {
    $('#file_name').val('');
    this.isEditing = true;
    this.isAddMode = true;
    //this.loading = true;
    console.log(userData);
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
      filename: userData.file_name, 
      docstatus: userData.docstatus,
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
    //this.loadPlans();
  }

  selectedFile: File | null = null;
  uploadedFileName: string = '';
  onFileSelect(event: any) { 
    const file = event.target.files[0];
    console.log(file);
    
    
    if (file) {
      this.selectedFile = file;
    }
     if (file == undefined) {
      this.selectedFile = null;
    }   
    
  }

checkDates(startDate: any, endDate: any) {
  if (!startDate || !endDate)
  return alert("Start date and end date are required.");

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    alert("Start date cannot be greater than end date.");
    return false;
  }
  return true;
}

  // ✅ Add User Flow
  async  addPlan(form: NgForm) { 
    //if (!form.valid) return; 
    const file = this.selectedFile;
    console.log(this.selectedFile);  
    if (!this.planArray.plan_id){
      if (!this.planArray.plan_name) return alert("Plan name should not be blank.");
      if (!this.checkDates(this.planArray.start_date, this.planArray.end_date)) {
        return; 
      }        
    }    
   if (!file || file == null) 
  return alert("No file selected");

    if (!this.planArray.plan_id){
      if (this.planArray.status === "" || this.planArray.status == null) {
        return alert("Select plan status.");
      }
    }

    if (this.planArray.docstatus === "" || this.planArray.docstatus == null) {
      return alert("Select plan document status.");
    } 
    //console.log(this.planArray);    
    this.loading = true;
    const filestatus = this.planArray.docstatus; 
    if (this.planArray.plan_id) {          
      // upload file to s3 sever       
        await this.fileupload(this.planArray.plan_id,filestatus);
         form.resetForm();   
           
    } else {
      const insertData = {
        plan_name: this.planArray.plan_name,
        start_date: this.planArray.start_date,
        end_date: this.planArray.end_date,
        status: this.planArray.status
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
            this.loading = false;
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
    $('#file_name').val('');
    //if (!form.valid) return;
    //console.log(this.planArray);

    if (!this.planArray.plan_name) return alert("Plan name should not be blank.");

    if (!this.checkDates(this.planArray.start_date, this.planArray.end_date)) {
      return; // stop function
    }

    if (this.planArray.status === "" || this.planArray.status == null) {
      return alert("Select plan status.");
    }

    if (this.planArray.docstatus === "" || this.planArray.docstatus == null) {
      return alert("Select plan document status.");
    } 

    this.loading = true; 

    const updateData = {
      plan_name: this.planArray.plan_name,
      start_date: this.planArray.start_date,
      end_date: this.planArray.end_date,
      status: this.planArray.status
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
      status: this.planArray.docstatus
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
              this.fileupload(this.planArray.id,this.planArray.status);                
          }
          
          this.loadPlans();
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
     
    //alert(plan_id);
   
    const file = this.selectedFile;
    if (!file) return alert("No file selected");

    const payload = {
      fileName: file.name,
      fileType: file.type,
      plan_id: plan_id,
      env: environment.env
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
            //alert(this.isAddMode);
            if(!this.isAddMode){
              this.saveFileUrlToDB(plan_id, parsed.fileUrl,documentstatus);
            }else{
              this.updateFileUrlToDB(this.planArray.plan_document_id, parsed.fileUrl,documentstatus);
            }
            this.selectedFile = null;
            
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
          this.closeAddUserModal();     
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