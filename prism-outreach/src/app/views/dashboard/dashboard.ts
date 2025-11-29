import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ApiResponseAllmyworkspace, ProviderPerformance, AddActionMasterData, ApiResponse, ApiResponseMemberGapsList, ApiResponseTaskdata, Altaddress} from '../../models/api-response';
//import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; 
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit } from '@angular/core';
import { Modal } from 'bootstrap'; // ✅ Bootstrap Modal class (no jQuery)
import { FormsModule,ReactiveFormsModule,FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
// import { ReactiveFormsModule } from '@angular/forms';
import 'datatables.net';
import { switchMap } from 'rxjs/operators';
declare var $: any;
@Component({
  selector: 'app-dashboard',
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})


export class Dashboard implements OnInit {
  
  selectedMedicaidIds: string[] = [];
  userId: number | null = null; 
  userRole: number | null = null;
  selectedNavigator: number | null = null;
  flashMessage: string | null = null;
  addActionChangeFlag: number = 0; 
  apiRes: ApiResponseAllmyworkspace = {
    statusCode: 0,
    data: {    
      departmentList: [],
      planList: [],
      members: [],
      overallRiskQualitySummary: [],
      ownRiskQualitySummary: [],
      recentActivity:[],
      referralList:[]
    },
  };
    apiResTask: ApiResponseTaskdata = {
    statusCode: 0,
    data: {    
       actionActivityType: [],
       navigatorList: [],
    },
  };  
 
  commonApiRes: ApiResponse = {
    statusCode: 0,
    data: [],
  };  
  actionMaster: AddActionMasterData = {
    statusCode: 0,
      data: {    
        actionActivityCategory: [],
        actionActivityType: [],
        navigatorList: []
      },
    };
  ApiResponseMemberGapsList: ApiResponseMemberGapsList = {
    statusCode: 0,
      data: {    
        prismGapList: [],
        prismQualityList: [],
         prismCihPcrList: []
      },
    };
  members: any[] = [];
  navigatorList: any[] = [];
  performanceArray: Record<string, ProviderPerformance>[] = [];
  totalArray: any = {};
  overallSummary: any = {};
  ownSummary: any = {};
  modalInstance: any;
  action_activity_category: any[] = [];
  action_ativity_type: any[] = [];
  actionresult_followup_list: any[] = [];
  memberGapList: any[] = [];
  memberQualityList: any[] = [];
  cihpcrList: any[] = [];
  memberTaskList: any[] = [];  
  isActionVisible = true;
  isNextActivityVisible = true;
  addActionFormGroup!: FormGroup;
  appointmentFormGroup!: FormGroup;
  medicaid_id: string = '';
  member_name: string = '';
  isObsFieldVisible: boolean[] = [];
  isRiskFieldVisible: boolean[] = [];
  showRiskGaps = true;
  showQualityGaps = true;
  isLoading: boolean = false; // controls spinner visibility
  isCollapseThreeOpen = false;
  ////////////////////////////
  qualityIds: string[] = [];             // checked quality gap IDs
  gapIds: string[] = [];                 // checked risk gap IDs
  qualityObservationList: any[] = [];    // all quality observation data
  riskObservationList: any[] = [];       // all risk observation data
  ////////////////////////////////////
  j: any;
  quality: any;
  ///////////////////////////////
  qualityList: any[] = [];
  callList: any[] = [];  gapList: any[] = [];benefitsList: any[] = [];  taskList: any[] = [];  
  departmentList:  any[] = [];  
  recentActivity: any[] = [];  
  referralList: any[] = [];    
  planList: any[] = [];  
  updateDataArray: any[] = [];
  userList: any[] = [];
  memberDetails: any[] = [];
  alt_address: Altaddress[] = [];
  member_alt_phone_details: any[] = [];
  all_language_master_list: any[] = [];
  member_alt_language_details: any[] = [];
  pcp_list: any[] = [];  
  log_details: any[] = []; 
  callListModal: any;
  gapListModal: any;
  qualityListModal: any; 
  benefitsListModal: any;
  taskListModal: any;
  transferModal: any;
  planListModal: any;
  memberDetailsModal: any;
   // Data for call list modal
  selectedProviderName: string = '';
  selectedMedicaidId: string = ''; 
  selectedName: string='';   
  task_add_update_form: boolean =false;
  transfer_form: boolean =true;
  //addActionFormGroup: any; 
  transferFormGroup!:FormGroup;
  planassignFormGroup!:FormGroup;
  memberInfoFormGroup!:FormGroup;
  altAddressFormGroup!:FormGroup;
  altPhoneFormGroup!:FormGroup;
  altLangFormGroup!:FormGroup;
  isEditMode: boolean | undefined;
  currentTaskId: number | undefined;
  sel_panel_type: any = {};  
  //navigatorList: any = {};      
  selectedCount: any;
  addTaskFormGroup!:FormGroup;
   // 🔹 Provider TIN → Name mapping
  providerTinNameMapping: Record<string, string> = {
    '200807794': 'Mercado Medical Practice',
    '237082074': 'GPHA',
    '273160687': 'Dr. Milbourne',
  };



 /////////////////////////////////
  constructor(
    private apiService: ApiService,
    private router: Router,
    private auth: AuthService,
    private fb: FormBuilder,
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
      const user = this.auth.getUser();
      //console.log(44);
      //console.log(user);
      // if (!user) {
      //   //alert('User not logged in!');
      //   this.router.navigate(['/login']);
      //   return;
      // }
      this.userRole = user.role_id;
      this.addTaskFormGroup = this.fb.group({
        task_next_panel_id: ['', Validators.required],
        task_date: ['', Validators.required],
        task_assign_to: ['', Validators.required],
        task_status: ['', Validators.required],
        task_action_note: ['']
      });

      this.transferFormGroup = this.fb.group({
        department_id: ['', Validators.required],
        user_id: ['', Validators.required], 
        referring_reason: [''],
        selected_medicaid_ids: ['']
      });

      this.planassignFormGroup = this.fb.group({
        plan_id: ['', Validators.required],
        selected_medicaid_ids_assign: ['']
      });

      this.memberInfoFormGroup = this.fb.group({
      assign_to: [''],
      medicaid_id: [''],
      preferred_call_time: ['10.30 PM']
    });
     this.altAddressFormGroup = this.fb.group({
      medicaid_id: [''],
      alt_address: [''],
      alt_city: [''],
      alt_state: [''],
      alt_zip: [''],
      created_date: ['']
    });

     this.altPhoneFormGroup = this.fb.group({
      medicaid_id: [''],
      alt_phone_no: [''] 
    });

     this.altLangFormGroup = this.fb.group({
      medicaid_id: [''],
      alt_language_name: [''],
      alt_language: [''] 
    });


    
      
      this.addActionFormGroup = this.fb.group({
          action_id: [18],
          panel_id: [17],
          action_date: ['',Validators.required],
          action_status: ['Success',Validators.required],
          action_result_id: ['',Validators.required],
          action_note: ['',Validators.required],
          next_panel_id: [''],
          next_action_date: [''],
          next_action_note: [''],
          vendor_name: [''],
          appointment_date: [''],
          appointment_time: [''],
          appointment_note: [''],
          medicaid_id: [''],
          action_type_source: ['Member Action'],
          riskGapsList: this.fb.array([]),
          qualityGapsList: this.fb.array([])
        });
        this.appointmentFormGroup = this.fb.group({
          vendor_name: [''],
          appointment_date: [''],
          appointment_time: [''],
          appointment_note: ['']
        });  
    //this.userId = user.ID || user.id;
    this.userId = user.ID ?? user.id ?? 0;
    if (this.userId !== null) {
      if(user.role_id==9){
        this.loadDashboard(this.userId);

      }else{
        this.selectedNavigator = 0;
        this.route.queryParams.subscribe(params => {
          this.selectedNavigator = params['navigator'] || '0';
          //console.log('Selected Navigator:', this.selectedNavigator);
        });
          // this.route.queryParams.subscribe(params => {
          //    this.selectedNavigator = params['navigator'] || '0';
          //   //console.log('Selected Navigator:', selectedNavigator);
          //   // call API or filter data based on navigator ID
          // });
        // this.selectedNavigator = request.POST.get('selected_navigator', '0') 
         this.loadDashboard(this.selectedNavigator);
        //this.loadDashboard(0);
      }
    }
     //this.loadDashboard(this.userId);
    this.getAddActionMasterData();
    this.setScheduledActionStatus('17');
    if (this.qualityGapsList && this.qualityGapsList.controls) {
      this.isObsFieldVisible = this.qualityGapsList.controls.map(() => false);
    } else {
      this.isObsFieldVisible = [];
    }
    if (this.riskGapsList && this.riskGapsList.controls) {
      this.isRiskFieldVisible = this.riskGapsList.controls.map(() => false);
    } else {
      this.isRiskFieldVisible = [];
    }
  }
  get riskGapsList(): FormArray {
    return this.addActionFormGroup.get('riskGapsList') as FormArray;
  }
  get qualityGapsList(): FormArray {
    return this.addActionFormGroup.get('qualityGapsList') as FormArray;
  }
  toggleObsField(index: number) {
    this.isObsFieldVisible[index] = !this.isObsFieldVisible[index];
      setTimeout(() => {

      const actionForm = this.addActionFormGroup;

      $('.datepicker')
        .datepicker({
          format: 'mm/dd/yyyy',
          autoclose: true,
          todayHighlight: true
        })
        .on('changeDate', function (e: any) {

          const input        = e.target as HTMLInputElement;
          const selectedDate = e.format();

          const controlName = input.getAttribute('data-control');  // "Observation_Date"
          const arrayName   = input.getAttribute('data-array');    // "riskGapsList"
          const index       = input.getAttribute('data-index');    // row number
          const formType    = input.getAttribute('data-form');     // "action"

          if (!controlName) return;

          // FormArray field
          if (arrayName && index !== null) {
            const i = Number(index);

            if (formType === 'action' && arrayName === 'qualityGapsList') {
              actionForm.get(arrayName)
                ?.get([i])
                ?.get(controlName)
                ?.patchValue(selectedDate);
            }
          }
        });

    }, 300);
  }
  toggleriskObsField(index: number) {
    this.isRiskFieldVisible[index] = !this.isRiskFieldVisible[index];
    setTimeout(() => {

      const actionForm = this.addActionFormGroup;

      $('.datepicker')
        .datepicker({
          format: 'mm/dd/yyyy',
          autoclose: true,
          todayHighlight: true
        })
        .on('changeDate', function (e: any) {

          const input        = e.target as HTMLInputElement;
          const selectedDate = e.format();

          const controlName = input.getAttribute('data-control');  // "Observation_Date"
          const arrayName   = input.getAttribute('data-array');    // "riskGapsList"
          const index       = input.getAttribute('data-index');    // row number
          const formType    = input.getAttribute('data-form');     // "action"

          if (!controlName) return;

          // FormArray field
          if (arrayName && index !== null) {
            const i = Number(index);

            if (formType === 'action' && arrayName === 'riskGapsList') {
              actionForm.get(arrayName)
                ?.get([i])
                ?.get(controlName)
                ?.patchValue(selectedDate);
            }
          }
        });

    }, 300);
  }
  toggleRiskGaps(): void {
    this.showRiskGaps = !this.showRiskGaps;
  }
  toggleQualityGaps(): void {
    this.showQualityGaps = !this.showQualityGaps;
  }
  setRiskGapsData(riskGapsdata: any) {
  // Clear existing transactions
  this.riskGapsList.clear();

  if (riskGapsdata && Array.isArray(riskGapsdata)) {
    riskGapsdata.forEach((t: any) => {
      this.riskGapsList.push(this.fb.group({
        DIAG_CODE: [this.sanitize(t.DIAG_CODE)],
        DIAG_DESC: [this.sanitize(t.DIAG_DESC)],
        PROCESS_STATUS: [t.PROCESS_STATUS === 1],
        risk_gap_id: [t.id],
        Type: ['risk'],
        Gap_Code: [this.sanitize(t.Gap_Code)],
        Observation_Date: [
          (t.Observation_Date && t.Observation_Date !== '1900-01-01T00:00:00.000Z' && t.Observation_Date !== '01/01/1900')
            ? t.Observation_Date
            : ''
        ],
        Observation_Year: [this.sanitize(t.Observation_Year)],
        Observation_Code: [this.sanitize(t.Observation_Code)],
        CPT_Code_Modifier: [this.sanitize(t.CPT_Code_Modifier)],
        Observation_Code_Set: [this.sanitize(t.Observation_Code_Set)],
        Observation_Result: [this.sanitize(t.Observation_Result)],
        Service_Provider_NPI: [this.sanitize(t.Service_Provider_NPI)],
        Service_Provider_Taxonomy_Code: [this.sanitize(t.Service_Provider_Taxonomy_Code)],
        Service_Provider_Name: [this.sanitize(t.Service_Provider_Name)],
        Service_Provider_Type: [this.sanitize(t.Service_Provider_Type)],
        Service_Provider_RxProviderFlag: [this.sanitize(t.Service_Provider_RxProviderFlag)],
        Provider_Group_NPI: [this.sanitize(t.Provider_Group_NPI)],
        Provider_Group_Taxonomy_Code: [this.sanitize(t.Provider_Group_Taxonomy_Code)],
        Provider_Group_Name: [this.sanitize(t.Provider_Group_Name)],
        note: [this.sanitize(t.note)]
      }));
    });
    //console.log(riskGapsdata);
  }
}
sanitize(value: any) {
  return value === null || value === undefined || value === 'null' ? '' : value;
}
setQualityGapsData(qualityGapsdata: any) {
  // Clear existing list
  this.qualityGapsList.clear();

  if (qualityGapsdata && Array.isArray(qualityGapsdata)) {
    qualityGapsdata.forEach((t: any) => {
      this.qualityGapsList.push(
        this.fb.group({
          SUB_MEASURE: [this.sanitize(t.SUB_MEASURE)],
          MEASURE_NAME: [this.sanitize(t.MEASURE_NAME)],
          PROCESS_STATUS: [t.PROCESS_STATUS === 1],
          quality_gap_id: [t.id],
          Type: ['quality'],
          Gap_Code: [this.sanitize(t.Gap_Code)],

          // Handle invalid dates
          Observation_Date: [
            t.Observation_Date &&
            t.Observation_Date !== '1900-01-01T00:00:00.000Z' &&
            t.Observation_Date !== '01/01/1900'
              ? t.Observation_Date
              : ''
          ],

          Observation_Year: [this.sanitize(t.Observation_Year)],
          Observation_Code: [this.sanitize(t.Observation_Code)],
          CPT_Code_Modifier: [this.sanitize(t.CPT_Code_Modifier)],
          Observation_Code_Set: [this.sanitize(t.Observation_Code_Set)],
          Observation_Result: [this.sanitize(t.Observation_Result)],
          Service_Provider_NPI: [this.sanitize(t.Service_Provider_NPI)],
          Service_Provider_Taxonomy_Code: [this.sanitize(t.Service_Provider_Taxonomy_Code)],
          Service_Provider_Name: [this.sanitize(t.Service_Provider_Name)],
          Service_Provider_Type: [this.sanitize(t.Service_Provider_Type)],
          Service_Provider_RxProviderFlag: [this.sanitize(t.Service_Provider_RxProviderFlag)],
          Provider_Group_NPI: [this.sanitize(t.Provider_Group_NPI)],
          Provider_Group_Taxonomy_Code: [this.sanitize(t.Provider_Group_Taxonomy_Code)],
          Provider_Group_Name: [this.sanitize(t.Provider_Group_Name)],
          note: [this.sanitize(t.note)]
        })
      );
    });
  }
}

  ngAfterViewInit(): void {
    const modalEl = document.getElementById('addActionModal');
    if (modalEl) {
      this.modalInstance = new Modal(modalEl);
    }

       // 🔹 New Call List modal
    const callListEl = document.getElementById('callListModal');
    if (callListEl){
      this.callListModal = new Modal(callListEl);     
    } 
       // 🔹 New Gap List modal
    const gapListEl = document.getElementById('gapListModal');
    if (gapListEl) this.gapListModal = new Modal(gapListEl);

      // 🔹 New Quality List modal
    const qualityListEl = document.getElementById('qualityListModal');
    if (qualityListEl) this.qualityListModal = new Modal(qualityListEl);

     // 🔹 New benefits List modal
    const benefitsListEl = document.getElementById('benefitsListModal');
    if (benefitsListEl) this.benefitsListModal = new Modal(benefitsListEl);

      // 🔹 New benefits List modal
    const taskListEl = document.getElementById('taskListModal');
    if (taskListEl) this.taskListModal = new Modal(taskListEl);

    // 🔹 New transfer List modal
    const transferListEl = document.getElementById('transferModal');
    if (transferListEl) this.transferModal = new Modal(transferListEl);

    // 🔹 New Plan List modal
    const planListEl = document.getElementById('planListModal');
    if (planListEl) this.planListModal = new Modal(planListEl);

     // 🔹 New Plan List modal
    const memberdetailsListEl = document.getElementById('memberDetailsModal');
    if (memberdetailsListEl) this.memberDetailsModal = new Modal(memberdetailsListEl);


        // Initialize Bootstrap Datepicker
    $('.datepicker').datepicker({
      format: 'mm/dd/yyyy',
      autoclose: true,
      todayHighlight: true
    }).on('changeDate', (e: any) => {   // ← ARROW FUNCTION (no "this" issue)

      const input = e.target as HTMLInputElement;
      const controlName = input.getAttribute('formControlName');

      if (controlName) {
        this.addActionFormGroup.get(controlName)?.patchValue(e.format());
      }

    });
  }
  formatDate(date: Date): string {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  openModal(medicaid_id: string, member_name: string): void {
    this.modalInstance?.show();
    // this.isActionVisible = true;
    // this.isNextActivityVisible = true;
    // ✅ Force change detection to ensure lists render
    //this.isLoading = true;
    //alert(this.isLoading);
    const today = new Date();
      this.addActionFormGroup.patchValue({
        action_note: ''
      });
      this.addActionFormGroup.patchValue({
        action_result_id: ''
      });
//console.log(member_name);
    this.addActionFormGroup.patchValue({
      action_date: this.formatDate(today)   // mm/dd/yyyy
    });

    this.isRiskFieldVisible = [];
    this.isObsFieldVisible = [];
    this.medicaid_id = medicaid_id;
    this.member_name = member_name;
      if (this.addActionFormGroup) {
        this.addActionFormGroup.patchValue({ medicaid_id: medicaid_id });
      }

    this.ngZone.run(() => {
      
      this.getMemberGapsList(medicaid_id);
      this.getMemberTaskList(medicaid_id);
      
      this.cdRef.detectChanges();
      
    });

    // ✅ Reinitialize datepicker after DOM updates
  setTimeout(() => {

    $('.datepicker').datepicker({
      format: 'mm/dd/yyyy',
      autoclose: true,
      todayHighlight: true
    }).on('changeDate', (e: any) => {   // ← ARROW FUNCTION (no "this" issue)

      const input = e.target as HTMLInputElement;
      const controlName = input.getAttribute('formControlName');

      if (controlName) {
        this.addActionFormGroup.get(controlName)?.patchValue(e.format());
      }

    });

  }, 300);

  }

  closeModal(): void {
    if(this.addActionChangeFlag==1){
      this.addActionChangeFlag = 0;
      this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this.router.navigate(['/dashboard']);
      });      
    }
    this.modalInstance?.hide();
  }
  toggleActionView() {

    this.isActionVisible = !this.isActionVisible;
  }
  toggleNextActivityView() {
    this.isNextActivityVisible = !this.isNextActivityVisible;
  }
  onGapChecked(ii: number){

  }
  onQualityChecked(){

  }

/////////////////////////////////////////////////////////////////
//////// Show Call List ///////////
  showCallList(medicaid_id: number,fname: string,lname: string): void { 
    this.isLoading = true; // show loader
    this.selectedMedicaidId = medicaid_id.toString();
    this.selectedName = fname+' '+lname;
    const payload = { medicaid_id: this.selectedMedicaidId };

  this.apiService.post<ApiResponse>('prismGetcallhistory', payload)
    .subscribe({
      next: (res) => {     
        if (res.data) { 
         this.callList = res.data || [];            
         this.isLoading = false; // show loader 
        } else {
          console.warn('⚠️ No data found:', res);
        }
      },
      error: (err) => {
        console.error('❌ Dashboard load failed:', err);
        alert('Error in load call list. Please try again later.');
      }
    }); 
    
     this.callListModal?.show();
  }

  closeCallList(): void {
    this.callListModal?.hide();
  }


 //////// Show Gap List ///////////
  showGapList(medicaid_id: number,fname: string,lname: string): void { 
    this.isLoading = true; // show loader
    this.selectedMedicaidId = medicaid_id.toString();
    this.selectedName = fname+' '+lname;
    const payload = { medicaid_id: this.selectedMedicaidId };

  this.apiService.post<ApiResponse>('prismGetgapList', payload)
    .subscribe({
      next: (res) => {
        if (res.data) { 
         this.gapList = res.data || [];
         this.isLoading = false; // hide loader
          
        } else {
          //console.warn('⚠️ No data found:', res);
        }
      },
      error: (err) => {
        console.error('❌ Dashboard load failed:', err);
        alert('Error in load gap list. Please try again later.');
      }
    }); 

     this.gapListModal?.show();
  }

   closeGapList(): void {
    this.gapListModal?.hide();
  }
  
 //////// Show Quality List ///////////
  showCIHQualityList(medicaid_id: number,fname: string,lname: string): void { 
    this.isLoading = true; // show loader
    this.selectedMedicaidId = medicaid_id.toString();
    this.selectedName = fname+' '+lname;
    const payload = { medicaid_id: this.selectedMedicaidId };

  this.apiService.post<ApiResponse>('prismGetqualityList', payload)
    .subscribe({
      next: (res) => {      
        if (res.data) { 
         this.qualityList = res.data || []; 
         this.isLoading = false; // hide loader 
          
        } else {
          //console.warn('⚠️ No data found:', res);
        }
      },
      error: (err) => {
        console.error('❌ Dashboard load failed:', err);
        alert('Error in load quality list. Please try again later.');
      }
    }); 

     this.qualityListModal?.show();
  }

   closeQualityList(): void {
    this.qualityListModal?.hide();
  }
  
 //////// Show Benefits List ///////////
  showBenefits(medicaid_id: number,fname: string,lname: string): void { 
    this.isLoading = true; // show loader
    this.selectedMedicaidId = medicaid_id.toString(); 
    this.selectedName = fname+' '+lname;
    const payload = { medicaid_id: this.selectedMedicaidId };

  this.apiService.post<ApiResponse>('pismGetbenefits', payload)
    .subscribe({
      next: (res) => {      
        if (res.data) { 
         this.benefitsList = res.data || [];  
         this.isLoading = false; // hide loader
            //console.log(this.benefitsList);
          
        } else {
          //console.warn('⚠️ No data found:', res);
        }
      },
      error: (err) => {
        console.error('❌ Dashboard load failed:', err);
        alert('Error in load benefits list. Please try again later.');
      }
    }); 

     this.benefitsListModal?.show();
  }

   closeBenefitsList(): void {
    this.benefitsListModal?.hide();
  }
  

  //////// Add and Update Task List ///////////
  add_update_task_click(medicaid_id: number,fname: string,lname: string): void { 
    this.isLoading = true; // show loader
    this.selectedMedicaidId = medicaid_id.toString(); 
    this.selectedName = fname+' '+lname;
    const payload = { medicaid_id: this.selectedMedicaidId };

  this.apiService.post<ApiResponse>('prismGetMemberUpcommingTaskList', payload)
  .subscribe({
    next: (res) => {      
      if (res.data) { 
        this.taskList = res.data || [];  
        this.isLoading = false; // hide loader
        //console.log('Task list:', this.taskList);        
      } else {
        this.taskList = [];
      }
    },
    error: (err) => {
      console.error('❌ Dashboard load failed:', err);
      alert('Error in update task. Please try again later.');
    }
  });     
     this.taskListModal?.show();
  }

   closeTaskList(): void {
    this.taskListModal?.hide();
  }

   closePlanList(): void {
    this.planListModal?.hide();
    (document.getElementById('action_ids') as HTMLSelectElement).value = '';
  }

  add_task_click(){ 
  this.task_add_update_form = !this.task_add_update_form
    setTimeout(() => {
      $('.datepicker').datepicker({
        format: 'mm/dd/yyyy',
        autoclose: true,
        todayHighlight: true
      }).on('changeDate', (e: any) => {   // ← ARROW FUNCTION (no "this" issue)

        const input = e.target as HTMLInputElement;
        const controlName = input.getAttribute('formControlName');
        //alert(controlName);
        if (controlName) {
          this.addTaskFormGroup.get(controlName)?.patchValue(e.format());
        }

      });
    }, 200);
  }

  add_update_task_submit() {
    //alert(this.addTaskFormGroup.valid);
    //console.log(this.addTaskFormGroup);
  if (this.addTaskFormGroup.valid) {
    this.isLoading = true;
     const formValue = this.addTaskFormGroup.value;
     const user = this.auth.getUser();
     const userId = user.ID;
      
     if (this.isEditMode) {
          const updateData = { 
              action_id: formValue.task_next_panel_id,  
              assign_to: formValue.task_assign_to,
              action_date: formValue.task_date,
              action_note: formValue.task_action_note,
              status: formValue.task_status 
            };

            const payload = {
              updateData: updateData,
              table_name: 'MEM_TASK_FOLLOW_UP',
              id_field_name: 'id',
              id_field_value: this.currentTaskId
            };

            //console.log('Updating record:', payload);

            this.apiService.post('prismMultiplefieldupdate', payload).subscribe({
              next: (res) => {
                //console.log('Update Response:', res);
                 ////////////////// Log entry start //////////////////////
              const LogArray = {
                  medicaid_id: this.selectedMedicaidId,
                  log_name: 'UPDATE TASK',
                  log_details: 'UPDATE TASK FOR '+ this.selectedMedicaidId,
                  log_status: 'Success',
                  log_by: userId,
                  action_type: 'UPDATE TASK'
              }; 
              this.add_system_log([LogArray]);
          ///////////////////// Log entry end ///////////////////// 

                this.addTaskFormGroup.reset();
                this.add_task_click();
                this.isLoading = false;
                this.closeTaskList();
                window.location.href = '/dashboard';
              },
              error: (err) => {
                console.error('❌ Update API Error:', err);
                this.isLoading = false;
              }
            });



     }else{
            const insertData = {
              medicaid_id: this.selectedMedicaidId, 
              action_id: formValue.task_next_panel_id,  
              assign_to: formValue.task_assign_to,
              action_date: formValue.task_date,
              action_note: formValue.task_action_note,
              status: formValue.task_status,
              add_by: userId,  
            };

            const payload = {
              table_name: 'MEM_TASK_FOLLOW_UP',
              insertDataArray: [insertData]
            };
            //console.log('📤 Sending payload:', payload);

            this.apiService.post('prismMultipleinsert', payload).subscribe({
            next: (res) => {

              ////////////////// Log entry start //////////////////////
                const LogArray = {
                    medicaid_id: this.selectedMedicaidId,
                    log_name: 'ADD TASK',
                    log_details: 'ADD TASK FOR '+ this.selectedMedicaidId,
                    log_status: 'Success',
                    log_by: userId,
                    action_type: 'ADD TASK'
                }; 
                this.add_system_log([LogArray]);
              ///////////////////// Log entry end ///////////////////// 

              this.addTaskFormGroup.reset();
              this.isLoading = false;
              this.closeTaskList();
              window.location.href = '/dashboard';
            },
            error: (err) => {
              console.error('❌ API Error:', err);
              this.isLoading = false;
            }
          });

     }
     
    
  } else {
    alert('Please fill all required fields.');
    this.isLoading = false;
  }
}


update_task(task_id: number): void { 
  const payload = { task_id: task_id };
  //console.log(payload);
  this.isLoading = true;
  this.apiService.post<ApiResponse>('prismGetTaskDetailsByID', payload).subscribe({
    next: (res) => {
      //console.log('✅ Task Details Response:', res);

      if (res.data.length > 0) {
        const task = res.data[0]; // assuming API returns list
        //console.log(task);
        const formattedDate = this.formatDateToMDY(task.action_date);

        // ✅ Switch to edit mode
        this.isEditMode = true;
        this.currentTaskId = task_id;
         
        //✅ Fill form with response data
        this.addTaskFormGroup.patchValue({
          task_next_panel_id: task.action_id,
          task_date: formattedDate,
          task_assign_to: task.assign_to,
          task_status: task.status,
          task_action_note: task.action_note
        });
        
        this.add_task_click();
        this.task_add_update_form = true;
        this.isLoading = false;
      } else {
        alert('⚠️ No task found for this ID');
        this.isLoading = false;
      }
    },
    error: (err) => {
      console.error('❌ Failed to load task details:', err);
      alert('Error in updating task. Please try again.');
      this.isLoading = false;
    }
  });

}

getAction(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  this.selectedCount = this.selectedMedicaidIds.length;
    //console.log('Select value:', value);
    //console.log('Select value:', this.selectedCount);
  if (this.selectedCount === 0) {
    alert('⚠️ Please select at least one member.');
    return;
  }

  if(value == '1'){
    this.transferModal?.show();
  }else if(value == '2'){
    this.planListModal?.show();
  }
  
}

// Checkbox change event
  onCheckboxChange(event: Event, medicaid_id: string) {
    const isChecked = (event.target as HTMLInputElement).checked; 
    if (isChecked) {
      this.selectedMedicaidIds.push(medicaid_id);
    } else {
      this.selectedMedicaidIds = this.selectedMedicaidIds.filter(id => id !== medicaid_id);
    }

    // ✅ Update FormControl value (this is what the form reads)
    this.transferFormGroup.patchValue({
      selected_medicaid_ids: this.selectedMedicaidIds.join(',')
    });

    this.planassignFormGroup.patchValue({
      selected_medicaid_ids_assign: this.selectedMedicaidIds.join(',')
    }); 

    //console.log('Value:', this.selectedMedicaidIds);
  }

getUser(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  //console.log('Selected Department:', value); 
  const payload = { department_id: value };

  this.apiService.post<ApiResponse>('prismGetusersbydeptid', payload)
    .subscribe({
      next: (res) => {  
        if (res.data) { 
          //console.log(res.data);
          this.userList = res.data || [];
                
        } else {
          console.warn('⚠️ No data found:', res);
        } 

      },
      error: (err) => {
        console.error('❌ Dashboard load failed:', err);
        alert('Error in get user data. Please try again later.');
      }
    });

}

 closeTransfer(): void {
    this.transferModal?.hide();
    (document.getElementById('action_ids') as HTMLSelectElement).value = '';
  }

  updateOutreachmember(user_id: number) {

  // Create update array
  const updateData1 = this.selectedMedicaidIds.map((medicaid_id) => ({
    medicaid_id: medicaid_id,
    Care_Coordinator_id: user_id
  }));

  //console.log("Update Data:", updateData1);

  const apiparamUpdate1 = {
    table_name: 'MEM_OUTREACH_MEMBERS',
    id_field_name: 'medicaid_id',
    updates: updateData1   // send array directly
  };

  //console.log("API Payload:", apiparamUpdate1);

  // Call API
  this.apiService.post('prismMultipleRowAndFieldUpdate', apiparamUpdate1)
    .subscribe({
      next: (res) => {
        //console.log("Updated Successfully:", res);
      },
      error: (err) => {
        console.error("Update Failed:", err);
      }
    });

}


  tranfer_member_submit(): void {
    const formValue = this.transferFormGroup.value;
    const user = this.auth.getUser();
    const refer_by = user?.ID || 0;

      // ✅ Normalize selected Medicaid IDs
    const medicaidIds: number[] = (formValue.selected_medicaid_ids || '')
      .toString()
      .split(',')
      .map((id: string) => parseInt(id.trim(), 10))
      .filter((id: number) => !isNaN(id));

      if (medicaidIds.length === 0) {
        alert('⚠️ Please select at least one member.');
        return;
      }

      // ✅ Prepare insert payload
      const insertDataArray = medicaidIds.map((id) => ({
        medicaid_id: id,
        department_id: formValue.department_id,
        referring_reason: formValue.referring_reason,
        refer_to: formValue.user_id,
        refer_by: refer_by,
      }));

      // ✅ Loop through IDs 

      const payload = {
        table_name: 'MEM_REFERRING',
        insertDataArray: insertDataArray,
      };

      //console.log('Inserting referral data:', payload);

      // Insert into MEM_REFERRING
      this.apiService.post('prismMultipleinsert', payload).subscribe({
        next: (res) => {
          //console.log(formValue.user_id);
          //console.log('Insert success:', res);
          this.updateOutreachmember(formValue.user_id);

          ////////////////// Log entry start //////////////////////
          const LogArray = this.selectedMedicaidIds.map((medicaid_id) => ({
              medicaid_id: medicaid_id,
              log_name: 'TRANSFER MEMBER',
              log_details: 'TRANSFER MEMBER TO '+ formValue.user_id,
              log_status: 'Success',
              log_by: refer_by,
              action_type: 'TRANSFER MEMBER',
          })); 
          this.add_system_log(LogArray);
          ///////////////////// Log entry end /////////////////////

          // Reset and close modal
          this.transferFormGroup.reset();
          this.selectedMedicaidIds = [];
          this.uncheckAllMembers();
          this.closeTransfer(); 
          // Navigation
          //window.location.href = '/dashboard';

        },
        error: (err) => {
          console.error('❌ Insert API error:', err);
          alert('Error during transfer member. Please try again.');
        },
      }); 

}

add_system_log(LogArray: { medicaid_id: string; log_name: string; log_details: string; log_status: string; log_by: any; action_type: string; }[]){  
       
      const payload = {
        table_name: 'MEM_SYSTEM_LOG',
        insertDataArray: LogArray,
      };
      //console.log('Inserting plan data:', payload); 
      this.apiService.post('prismMultipleinsert', payload).subscribe({
        next: (res) => {},
        error: (err) => {
          console.error('❌ Insert API error:', err);
          alert('Error during log insert. Please try again.');
        },
      });
}

assign_plan_submit(): void {
  const formValue = this.planassignFormGroup.value;
  const user = this.auth.getUser();
  const added_by = user?.ID || 0;

  // ✅ Normalize selected Medicaid IDs
  const medicaidIds: number[] = (formValue.selected_medicaid_ids_assign || '')
    .toString()
    .split(',')
    .map((id: string) => parseInt(id.trim(), 10))
    .filter((id: number) => !isNaN(id));

  if (medicaidIds.length === 0) {
    alert('⚠️ Please select at least one member.');
    return;
  }

  if (!formValue.plan_id) {
    alert('⚠️ Please select a plan.');
    return;
  }

  // ✅ Loop through each medicaid_id and check if plan already exists
  const planCheckPromises = medicaidIds.map((medicaid_id) => {
    const params = { medicaid_id: medicaid_id, plan_id: formValue.plan_id };
    return this.apiService.post('prismPlanexist', params).toPromise()
      .then((res: any) => {
        if (res?.data?.length > 0) {
          // If plan already exists for a member
          throw new Error(`Plan already exists for member #${medicaid_id}`);
        }
      });
  });

  // ✅ Wait for all existence checks before inserting
  Promise.all(planCheckPromises)
    .then(() => {
      // ✅ If all members are valid, prepare insert payload
      const insertDataArray = medicaidIds.map((medicaid_id) => ({
        medicaid_id: medicaid_id,
        plan_id: formValue.plan_id,
        added_by: added_by,
      }));

      const payload = {
        table_name: 'MEM_PLAN_MEMBERS',
        insertDataArray: insertDataArray,
      };

      //console.log('✅ Inserting plan data:', payload);

      // ✅ Insert all records at once
      this.apiService.post('prismMultipleinsert', payload).subscribe({
        next: (res) => {
          
          ////////////////// Log entry start //////////////////////
          const LogArray = this.selectedMedicaidIds.map((medicaid_id) => ({
              medicaid_id: medicaid_id,
              log_name: 'ASSIGN PLAN',
              log_details: 'PLAN ASSIGN TO '+ medicaid_id,
              log_status: 'Success',
              log_by: added_by,
              action_type: 'ASSIGN PLAN',
          })); 
          this.add_system_log(LogArray);
          ///////////////////// Log entry end /////////////////////
          
          this.planassignFormGroup.reset();
          this.selectedMedicaidIds = [];
          this.uncheckAllMembers();
          this.closePlanList();
          window.location.href = '/dashboard';
         //alert('✅ Plan assigned successfully!');
        },
        error: (err) => {
          console.error('❌ Insert API error:', err);
          alert('Error during insertion of plan. Please try again.');
        },
      });
    })
    .catch((err) => {
      // ❌ If any plan already exists, show message and stop
      alert(err.message);
      console.warn(err.message);
    });

      
}

uncheckAllMembers(): void {
  // If you store selected member IDs
  this.selectedMedicaidIds = [];

  // If you are using checkboxes bound with [(ngModel)] or reactive form array:
  const checkboxes = document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]');
  checkboxes.forEach(cb => cb.checked = false);
}

formatDateToMDY(dateStr: string): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${day}/${year}`; // m/d/Y format
}

////////////////////////////////////////////////////////////////

showFlash(msg: string) {
  this.flashMessage = msg;

  setTimeout(() => {
    this.flashMessage = null;
  }, 3000);  // hides after 3s
}
  getMemberGapsList(medicaid_id: string){
    const payload = { medicaid_id: medicaid_id };
    //console.log(payload);
    this.isLoading = true;
    this.apiService.post<ApiResponseMemberGapsList>('prismGetMemberGapsList', payload)
      .subscribe({
        next: (res) => {
          //this.commonApiRes = res;
          //console.log(res);
          if (res.data) {
            this.memberGapList = res.data.prismGapList || [];
            this.memberQualityList = res.data.prismQualityList || [];
            this.cihpcrList = res.data.prismCihPcrList || [];
            this.memberGapList = (res.data.prismGapList || []).map(gap => ({
              ...gap,
              Observation_Date: this.formatDateToMDY(gap.Observation_Date)
            }));
            this.memberQualityList = (res.data.prismQualityList || []).map(qgap => ({
              ...qgap,
              Observation_Date: this.formatDateToMDY(qgap.Observation_Date)
            }));            

            console.log(this.cihpcrList);
            this.setRiskGapsData(this.memberGapList);
            this.setQualityGapsData(this.memberQualityList);
            //this.actionresult_followup_list = res.data;
          } else {
            console.warn('⚠️ No data found:', res);
          }
        },
        error: (err) => {
          console.error('❌ Dashboard load failed:', err);
          //alert('Server error. Please try again later.');
        },
        complete: () => {
          this.isLoading = false;
        }
      });  
  }
  getMemberTaskList(medicaid_id: string){
    const payload = { medicaid_id: medicaid_id };
    //console.log(payload);
    this.apiService.post<ApiResponse>('prismGetMemberUpcommingTaskList', payload)
      .subscribe({
        next: (res) => {
          //this.commonApiRes = res;
          //console.log(res);
          if (res.data) {
            this.memberTaskList = res.data || [];
            

            //this.actionresult_followup_list = res.data;
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
  setScheduledActionStatus(id: string) {
    
    const role_id = this.userRole;
    const payload = { scheduled_type: id, role_id : role_id };
    //console.log(payload);
    this.apiService.post<ApiResponse>('prismActionresultfollowup', payload)
      .subscribe({
        next: (res) => {
          this.commonApiRes = res;
          //console.log(res);
          if (res.data) {
            this.actionresult_followup_list = res.data;
          } else {
            console.warn('⚠️ No data found:', res);
          }
        },
        error: (err) => {
          console.error('❌ Dashboard load failed:', err);
          //alert('Server error. Please try again later.');
        }
      });    // your logic here
  }
  getAddActionMasterData(){
    const payload = {  };

    this.apiService.post<AddActionMasterData>('prismGetAddActionMasterData', payload)
      .subscribe({
        next: (res) => {
          this.actionMaster = res;
          //console.log(res);
          if (res.data) {
            this.action_activity_category = res.data.actionActivityCategory || [];
            this.action_ativity_type = res.data.actionActivityType || [];
           this.navigatorList = res.data.navigatorList || [];
          } else {
            console.warn('⚠️ No data found:', res);
          }
        },
        error: (err) => {
          console.error('❌ Dashboard load failed:', err);
          alert('Error in load add action call. Please try again later.');
        }
      });
  }
onNavigatorChange(event: Event): void {
  const selectedValue = (event.target as HTMLSelectElement).value;
  const navigatorId = Number(selectedValue); // ✅ Convert string → number
  //alert(navigatorId);
  this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    this.router.navigate(['/dashboard'], { queryParams: { navigator: navigatorId } });
  });
  
  // if (!isNaN(navigatorId)) {
  //   this.loadDashboard(navigatorId);
  // }
  // 🔹 Submit the form
  // const form = document.getElementById('navigatorForm') as HTMLFormElement;
  // if (form) {
  //   form.submit();
  // }  
}  
// loadDashboard(user_id: number) {
//   const payload = { user_id: user_id };
//   //console.log(payload);
// this.isLoading = true; // 🔹 show loader
//   this.apiService.post<ApiResponseAllmyworkspace>('prismOutreachAllmyworkspaceSP', payload)
//     .subscribe({
//       next: (res) => {
//         this.apiRes = res;
//         //console.log(res);
//         if (res.data) {
//           this.members = res.data.members || [];
//           this.overallSummary = res.data.overallRiskQualitySummary || [];
//           this.ownSummary = res.data.ownRiskQualitySummary || [];
//           //this.navigatorList = res.data.navigatorList || [];
//           this.calculatePerformance(res.data);
//           this.isLoading = false; // 🔹 show loader
//           this.departmentList = res.data.departmentList || [];
//           this.recentActivity = res.data.recentActivity || [];
//           this.referralList = res.data.referralList || [];
//           this.planList = res.data.planList || [];   
          
//            // ✅ Initialize DataTables after DOM updates
//           this.ngZone.runOutsideAngular(() => {
//             setTimeout(() => {
//               this.initializeDataTable('#members', true);
//               this.initializeDataTable('#transferList');
//             }, 300);
//           });
//           this.cdRef.detectChanges();
//         } else {
//           console.warn('⚠️ No data found:', res);
//           this.isLoading = false; 
//         }
//       },
//       error: (err) => {
//         console.error('❌ Dashboard load failed:', err);
//         alert('Server error. Please try again later.');
//         this.isLoading = false; 
//       }
//     });
// }
loadDashboard(user_id: number) {
  const payload = { user_id };

  this.isLoading = true;

  this.apiService.post('prismGetUserMemberList', payload)   // 1️⃣ First API
    .pipe(
      switchMap((userMemberRes: any) => {
        // You can save the response if needed
        
        this.members = userMemberRes.data || [];
          this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {
              this.initializeDataTable('#members', true);
              this.isLoading = false;
            }, 300);
          });        
        
        // 2️⃣ Call second API only after first completes
        return this.apiService.post<ApiResponseAllmyworkspace>('prismOutreachAllmyworkspaceSP', payload);
      })
    )
    .subscribe({
      next: (res) => {
        this.apiRes = res;

        if (res.data) {
          //this.members = res.data.members || [];
          this.overallSummary = res.data.overallRiskQualitySummary || [];
          this.ownSummary = res.data.ownRiskQualitySummary || [];
          this.departmentList = res.data.departmentList || [];
          this.recentActivity = res.data.recentActivity || [];
          this.referralList = res.data.referralList || [];
          this.planList = res.data.planList || [];

          this.calculatePerformance(res.data);

          // Reinitialize DataTables
          this.ngZone.runOutsideAngular(() => {
            setTimeout(() => {
              this.initializeDataTable('#members', true);
              //this.initializeDataTable('#transferList');
            }, 300);
          });
          
          this.cdRef.detectChanges();
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Dashboard load failed:', err);
        alert('Error in load mywork page. Please try again later.');
        this.isLoading = false;
      }
    });
}

private initializeDataTable(selector: string, disableFirstColumnSort: boolean = false): void {
  const table = $(selector);
  if ($.fn.DataTable.isDataTable(table)) {
    table.DataTable().destroy();
  }

  const config: any = {
    dom: '<"d-flex justify-content-between align-items-center"lf>t<"d-flex justify-content-between"ip>',
    language: {
      search: "_INPUT_",
      searchPlaceholder: "Search",
    },
    autoWidth: false,   // IMPORTANT,
    columnDefs: [
    { width: "7%", targets: 4 } // <-- PCP VISIT column width
    ]
  };

  if (disableFirstColumnSort) {
    config.columnDefs = [{ orderable: false, targets: 0 }];
  }

  table.DataTable(config);
}

loadtaskdata(){
   const payload = { };
   this.apiService.post<ApiResponseTaskdata>('prismGetAddActionMasterData', payload)
    .subscribe({
      next: (res) => { 
        this.apiResTask = res; 
        if (res.data) {
          //console.log(res.data);
          this.sel_panel_type = res.data.actionActivityType || []; 
        //  this.navigatorList = res.data.navigatorList || [];                
        } else {
          console.warn('⚠️ No data found:', res);
        } 

      },
      error: (err) => {
        console.error('❌ Dashboard load failed:', err);
        alert('Error in load task page. Please try again later.');
      }
    });  
}

calculatePerformance(data: any) {
  const performanceList = data.priorityAndOtherPerformanceSummary || [];
  const performanceArray: Record<string, ProviderPerformance>[] = [];
  const totalArray: any = this.initializeTotals();

  // 🔹 Provider TIN → Name mapping
  const providerTinNameMapping: Record<string, string> = {
    '200807794': 'Mercado Medical Practice',
    '237082074': 'GPHA',
    '273160687': 'Dr. Milbourne',
  };

  for (const item of performanceList) {
    const pcpId = String(item['PCP_TAX_ID']);
    const values: any = { ...item };
    delete values['PCP_TAX_ID'];

    const num = (v: any) => parseFloat(v || 0);

    // ---------- PRIORITY CALL ----------
    const priority_count = num(values.priority_count);
    const call_count = num(values.call_count);
    totalArray.total_priority_count += priority_count;
    totalArray.total_call_count += call_count;

    values.priority_percentage = this.percent(call_count, priority_count);
    values.priority_color = this.getColor(values.priority_percentage);

    // ---------- OTHER CALL ----------
    const other_call_count = num(values.other_call_count);
    const other_count = num(values.other_count);
    totalArray.total_other_call_count += other_call_count;
    totalArray.total_other_count += other_count;

    values.other_call_percentage = this.percent(other_call_count, other_count);
    values.other_call_color = this.getColor(values.other_call_percentage);

    // ---------- RISK GAPS ----------
    const priority_complete_gaps_count = num(values.priority_complete_gaps_count);
    const priority_gaps_count = num(values.priority_gaps_count);
    totalArray.total_priority_complete_gaps_count += priority_complete_gaps_count;
    totalArray.total_priority_gaps_count += priority_gaps_count;

    values.priority_gaps_percentage = this.percent(priority_complete_gaps_count, priority_gaps_count);
    values.priority_gaps_color = this.getColor(values.priority_gaps_percentage);

    const other_gaps_count = num(values.other_gaps_count);
    const other_complete_gaps_count = num(values.other_complete_gaps_count);
    totalArray.total_other_gaps_count += other_gaps_count;
    totalArray.total_other_complete_gaps_count += other_complete_gaps_count;

    values.other_gaps_percentage = this.percent(other_complete_gaps_count, other_gaps_count);
    values.other_gaps_color = this.getColor(values.other_gaps_percentage);

    // ---------- QUALITY GAPS ----------
    const priority_complete_quality_gaps_count = num(values.priority_complete_quality_gaps_count);
    const priority_quality_gaps_count = num(values.priority_quality_gaps_count);
    totalArray.total_priority_complete_quality_gaps_count += priority_complete_quality_gaps_count;
    totalArray.total_priority_quality_gaps_count += priority_quality_gaps_count;

    values.priority_quality_gaps_percentage = this.percent(priority_complete_quality_gaps_count, priority_quality_gaps_count);
    values.priority_quality_gaps_color = this.getColor(values.priority_quality_gaps_percentage);

    const other_quality_gaps_count = num(values.other_quality_gaps_count);
    const other_complete_quality_gaps_count = num(values.other_complete_quality_gaps_count);
    totalArray.total_other_quality_gaps_count += other_quality_gaps_count;
    totalArray.total_other_complete_quality_gaps_count += other_complete_quality_gaps_count;

    values.other_quality_gaps_percentage = this.percent(other_complete_quality_gaps_count, other_quality_gaps_count);
    values.other_quality_gaps_color = this.getColor(values.other_quality_gaps_percentage);

    // ---------- PCP VISITS ----------
    const priority_pcp_visit_count = num(values.priority_pcp_visit_count);
    const other_pcp_visit_count = num(values.other_pcp_visit_count);
    totalArray.total_priority_count_pcp += priority_pcp_visit_count;
    totalArray.total_other_count_pcp += other_pcp_visit_count;

    //console.log(other_pcp_visit_count);
    //console.log(totalArray.total_other_count_pcp);
    values.priority_pcp_visit_percentage = this.percent(priority_pcp_visit_count, priority_count);
    values.priority_pcp_visit_color = this.getColor(values.priority_pcp_visit_percentage);

    values.other_pcp_visit_percentage = this.percent(other_pcp_visit_count, other_count);
    values.other_pcp_visit_color = this.getColor(values.other_pcp_visit_percentage);

    // ---------- PROVIDER NAME ----------
    values.provider_name = providerTinNameMapping[pcpId] || '';

    performanceArray.push({ [pcpId]: values });
  }

  // ---------- TOTAL PERCENTAGES ----------
  totalArray.priority_call_percentage = this.percent(totalArray.total_call_count, totalArray.total_priority_count);
  totalArray.other_call_percentage = this.percent(totalArray.total_other_call_count, totalArray.total_other_count);

  totalArray.priority_gaps_percentage = this.percent(totalArray.total_priority_complete_gaps_count, totalArray.total_priority_gaps_count);
  totalArray.other_gaps_percentage = this.percent(totalArray.total_other_complete_gaps_count, totalArray.total_other_gaps_count);

  totalArray.priority_quality_gaps_percentage = this.percent(totalArray.total_priority_complete_quality_gaps_count, totalArray.total_priority_quality_gaps_count);
  totalArray.other_quality_gaps_percentage = this.percent(totalArray.total_other_complete_quality_gaps_count, totalArray.total_other_quality_gaps_count);

  totalArray.priority_pcp_percentage = this.percent(totalArray.total_priority_count_pcp, totalArray.total_priority_count);
  totalArray.other_pcp_percentage = this.percent(totalArray.total_other_count_pcp, totalArray.total_other_count);

  // ---------- TOTAL COLORS ----------
  totalArray.priority_call_color = this.getColor(totalArray.priority_call_percentage);
  totalArray.other_call_color = this.getColor(totalArray.other_call_percentage);
  totalArray.priority_gaps_color = this.getColor(totalArray.priority_gaps_percentage);
  totalArray.other_gaps_color = this.getColor(totalArray.other_gaps_percentage);
  totalArray.priority_quality_gaps_color = this.getColor(totalArray.priority_quality_gaps_percentage);
  totalArray.other_quality_gaps_color = this.getColor(totalArray.other_quality_gaps_percentage);
  totalArray.priority_pcp_color = this.getColor(totalArray.priority_pcp_percentage);
  totalArray.other_pcp_color = this.getColor(totalArray.other_pcp_percentage);

  // ---------- SAVE FINAL ----------
  this.performanceArray = performanceArray;
  this.totalArray = totalArray;

  //console.log('✅ Provider performance summary:', this.performanceArray);
  //console.log('✅ Totals:', this.totalArray);
}


  initializeTotals() {
    return {
      total_priority_count: 0,
      total_call_count: 0,
      total_other_call_count: 0,
      total_other_count: 0,
      total_priority_complete_gaps_count: 0,
      total_priority_gaps_count: 0,
      total_other_gaps_count: 0,
      total_other_complete_gaps_count: 0,
      total_priority_complete_quality_gaps_count: 0,
      total_priority_quality_gaps_count: 0,
      total_other_quality_gaps_count: 0,
      total_other_complete_quality_gaps_count: 0,
      total_priority_count_pcp: 0,
      total_other_count_pcp: 0
    };
  }

  percent(a: number, b: number): number {
    return b > 0 ? +(a / b * 100).toFixed(2) : 0;
  }

  getColor(percent: number): string {
    if (percent < 60) return 'red';
    if (percent < 80) return '#FFAE42';
    return 'green';
  }
  add_update_observation(code: string, type: string, index: number): void {
    if (type === 'risk') {
      const el = document.getElementById('obs_field_list' + index);
      if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }

    if (type === 'quality') {
      const el = document.getElementById('obs_field_list_quality' + index);
      if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
  }

  add_update_action_submit(){
    if (this.addActionFormGroup.invalid) {
      this.addActionFormGroup.markAllAsTouched(); // show validation errors
      return;
    }
    //const user = this.auth.getUser();
    const formValues = this.addActionFormGroup.value;
    const action_id = formValues.update_action_id;
    //console.log(formValues);
    this.isLoading = true; // 🔹 show loader
    this.addActionChangeFlag = 1;
    // Prepare the payload like Django expects
    if (!action_id) {    
        const insert_data = {
          medicaid_id: formValues.medicaid_id,
          action_type_source: formValues.action_type_source,
          action_id: formValues.action_id,
          panel_id: formValues.panel_id,
          action_date: formValues.action_date,
          action_status: formValues.action_status,
          add_by: this.userId || '', // if you store user info in authService/session
          action_note: formValues.action_note,
          action_result_id: formValues.action_result_id,
        };

        const apiPayload = {
          table_name: 'MEM_MEMBER_ACTION_FOLLOW_UP',
          insertDataArray: [insert_data],
        };

        //console.log('📤 API Payload:', apiPayload);
        this.apiService.post('prismMultipleinsert', apiPayload).subscribe({
            next: (res: any) => {
              //console.log('✅ Data inserted:', res);
              if (res?.insertedIds) {
                const action_id = res.insertedIds;
                const next_panel_id = formValues.next_panel_id;
                if (next_panel_id) {
                  const taskPayload = {
                    table_name: 'MEM_TASK_FOLLOW_UP',
                    insertDataArray: [
                      {
                        medicaid_id: formValues.medicaid_id,
                        action_id: next_panel_id,
                        action_date: formValues.next_action_date,
                        action_note: formValues.next_action_note,
                        status: 'Open',
                        assign_to: this.userId,
                        add_by: this.userId,
                      },
                    ],
                  };
                  this.apiService.post('prismMultipleinsert', taskPayload).subscribe();
                }
                this.insertSystemLog(formValues);
                this.updateQualityAndRiskData(formValues, action_id); // ✅ also call here
                //console.log('✅ New Action ID:', action_id);
              }
              //alert('Action saved successfully!');
            },
            error: (err) => {
              console.error('❌ Error inserting action:', err);
              alert('Failed to save create a action!');
            },
        });
        
      } else {
      // === UPDATE MODE ===
          const updateData = {
            action_type_source: formValues.action_type_source,
            action_id: formValues.action_id,
            panel_id: formValues.panel_id,
            action_date: formValues.action_date,
            action_status: formValues.action_status,
            action_note: formValues.action_note,
            action_result_id: formValues.action_result_id,
          };

          const params = {
            updateData,
            table_name: 'MEM_MEMBER_ACTION_FOLLOW_UP',
            id_field_name: 'id',
            id_field_value: action_id,
          };

          this.apiService.post('prismMultiplefieldupdate', params).subscribe({
            next: () => {
                  this.insertSystemLog(formValues);
                  this.updateQualityAndRiskData(formValues, action_id); // ✅ also call here
                  //alert('Action updated successfully!');
                },
                error: (err) => {
                  console.error('❌ Error updating action:', err);
                  alert('Failed to update a action!');
                },
                complete: () => {
                  this.isLoading = false;
                }
            });

      }


    //console.log('Form Submitted ✅', this.addActionFormGroup.value);  
    //alert(88);
  }
  private insertSystemLog(formData: any): void {
   // alert(this.userId);
    //alert(formData.action_note);
    const logPayload = {
      table_name: 'MEM_SYSTEM_LOG',
      insertDataArray: [
        {
          medicaid_id: formData.medicaid_id,
          action_type: formData.action_type_name,
          log_name: formData.action_type_source,
          log_details: formData.action_note,
          log_status: formData.action_status,
          log_by: this.userId
        },
      ],
    };

    this.apiService.post('prismMultipleinsert', logPayload).subscribe();
  } 
  
  
  private updateQualityAndRiskData(formValues: any, action_id: string): void {
    const medicaid_id = formValues.medicaid_id;
    //console.log(formValues);
    const diagCodes: string[] = [];
    const qualitySubMeasures: string[] = [];
    const riskObsInsertArray: any[] = [];  
    const riskObsUpdateArray: any[] = [];
    if (formValues.riskGapsList && formValues.riskGapsList.length > 0) {
      formValues.riskGapsList.forEach((riskGap: any, index: number) => {
        //console.log(`Risk Gap ${index + 1}:`, riskGap);
        
        // Example: Access individual fields
        const gapId = riskGap.risk_gap_id;
        
        const processStatus = riskGap.PROCESS_STATUS;
       
        const diagCode = riskGap.DIAG_CODE;
        if (processStatus === true || processStatus === '1') {
          if (diagCode) {
            diagCodes.push(diagCode);
          }
        }
          const commonData = {
            medicaid_id: medicaid_id,
            Type: riskGap.Type,
            Gap_Code: riskGap.DIAG_CODE,
            Observation_Date: riskGap.Observation_Date,
            Observation_Year: new Date(riskGap.Observation_Date).getFullYear(),
            Observation_Code: riskGap.Observation_Code,
            CPT_Code_Modifier: riskGap.CPT_Code_Modifier,
            Observation_Code_Set: riskGap.Observation_Code_Set,
            Observation_Result: riskGap.Observation_Result,
            Service_Provider_NPI: riskGap.Service_Provider_NPI,
            Service_Provider_Taxonomy_Code: riskGap.Service_Provider_Taxonomy_Code,
            Service_Provider_Name: riskGap.Service_Provider_Name,
            Service_Provider_Type: riskGap.Service_Provider_Type,
            Service_Provider_RxProviderFlag: riskGap.Service_Provider_RxProviderFlag,
            Provider_Group_NPI: riskGap.Provider_Group_NPI,
            Provider_Group_Taxonomy_Code: riskGap.Provider_Group_Taxonomy_Code,
            Provider_Group_Name: riskGap.Provider_Group_Name,
            Source: "CIH",
            note: riskGap.note
          };        
        if(gapId){
           riskObsUpdateArray.push({ ...commonData, id: gapId, updated_date: new Date() });
          //riskObsUpdateArray.push(commonData);
        }else{
          // ------------------------
            // CHECK IF ANY FIELD HAS VALUE
            // ------------------------
            const observationFields = [
              riskGap.Observation_Date,
              riskGap.Observation_Code,
              riskGap.CPT_Code_Modifier,
              riskGap.Observation_Code_Set,
              riskGap.Observation_Result,
              riskGap.Service_Provider_NPI,
              riskGap.Service_Provider_Taxonomy_Code,
              riskGap.Service_Provider_Name,
              riskGap.Service_Provider_Type,
              riskGap.Service_Provider_RxProviderFlag,
              riskGap.Provider_Group_NPI,
              riskGap.Provider_Group_Taxonomy_Code,
              riskGap.Provider_Group_Name,
              riskGap.note
            ];

            // TRUE if ANY value is non-null, non-empty
            const hasAnyValue = observationFields.some(v => v !== null && v !== undefined && v !== "");
            if (hasAnyValue) {
              //riskObsInsertArray.push(commonData);
              riskObsInsertArray.push({
                ...commonData,
                added_date: new Date()
              });
  
            }        
        }
      });
    }

    if (formValues.qualityGapsList && formValues.qualityGapsList.length > 0) {
      formValues.qualityGapsList.forEach((qualityGap: any, index: number) => {
        //console.log(`Risk Gap ${index + 1}:`, qualityGap);
        
        // Example: Access individual fields
        const gapId = qualityGap.quality_gap_id;
        
        const processStatus = qualityGap.PROCESS_STATUS;
       
        const subMeasure = qualityGap.SUB_MEASURE;
        if (processStatus === true || processStatus === '1') {
          if (subMeasure) {
            qualitySubMeasures.push(subMeasure);
          }
        }
          const qualityObsUpdate = {
            medicaid_id: medicaid_id,
            Type: qualityGap.Type,
            Gap_Code: qualityGap.SUB_MEASURE,
            Observation_Date: qualityGap.Observation_Date,
            Observation_Year: new Date(qualityGap.Observation_Date).getFullYear(),
            Observation_Code: qualityGap.Observation_Code,
            CPT_Code_Modifier: qualityGap.CPT_Code_Modifier,
            Observation_Code_Set: qualityGap.Observation_Code_Set,
            Observation_Result: qualityGap.Observation_Result,
            Service_Provider_NPI: qualityGap.Service_Provider_NPI,
            Service_Provider_Taxonomy_Code: qualityGap.Service_Provider_Taxonomy_Code,
            Service_Provider_Name: qualityGap.Service_Provider_Name,
            Service_Provider_Type: qualityGap.Service_Provider_Type,
            Service_Provider_RxProviderFlag: qualityGap.Service_Provider_RxProviderFlag,
            Provider_Group_NPI: qualityGap.Provider_Group_NPI,
            Provider_Group_Taxonomy_Code: qualityGap.Provider_Group_Taxonomy_Code,
            Provider_Group_Name: qualityGap.Provider_Group_Name,
            Source: "CIH",
            note: qualityGap.note
          };        
        if(gapId){
          riskObsUpdateArray.push({ ...qualityObsUpdate, id: gapId, updated_date: new Date() });
          //riskObsUpdateArray.push(riskObsUpdate);
        }else{
            // ------------------------
            // CHECK IF ANY FIELD HAS VALUE
            // ------------------------
            const observationFields = [
              qualityGap.Observation_Date,
              qualityGap.Observation_Code,
              qualityGap.CPT_Code_Modifier,
              qualityGap.Observation_Code_Set,
              qualityGap.Observation_Result,
              qualityGap.Service_Provider_NPI,
              qualityGap.Service_Provider_Taxonomy_Code,
              qualityGap.Service_Provider_Name,
              qualityGap.Service_Provider_Type,
              qualityGap.Service_Provider_RxProviderFlag,
              qualityGap.Provider_Group_NPI,
              qualityGap.Provider_Group_Taxonomy_Code,
              qualityGap.Provider_Group_Name,
              qualityGap.note
            ];

            // TRUE if ANY value is non-null, non-empty
            const hasAnyValue = observationFields.some(v => v !== null && v !== undefined && v !== "");
            if (hasAnyValue) {
              //riskObsInsertArray.push(qualityObsUpdate);
              riskObsInsertArray.push({
                ...qualityObsUpdate,
                added_date: new Date()
              });

            }          
        }
        //console.log(qualityObsUpdate);
      });
      //console.log("Update array : ",riskObsUpdateArray);
      //console.log("Insert array : ",riskObsInsertArray);
    }
           // ✅ Create parameter object
      const paramsunsetq = {
        medicaid_id: medicaid_id,
        action_id: action_id
      };
        this.apiService.post('prismUnSetMemberGapsStatus', paramsunsetq).subscribe({
            next: (res: any) => {
              //console.log('✅ Data inserted:', res);
             //console.log('Member gaps unset successfully')
              //alert('Action saved successfully!');
              const diagVal = diagCodes.length > 0 ? `'${diagCodes.join("','")}'` : '';
              const paramsupdate = {
                medicaid_id: medicaid_id,
                diag_codes: diagVal,
                action_id: action_id
              };
              this.apiService.post('prismUpdategapStatus', paramsupdate).subscribe({
                  next: (updateRes: any) => {
                    //console.log('✅ Risk status updated successfully:', updateRes);
                    // ✅ Step 3: Update existing Observation rows
                                if (riskObsUpdateArray.length > 0) {
                                  const apiparamUpdate = {
                                    table_name: "MEM_GAP_OBSERVATION_DATA",
                                    id_field_name: "id",
                                    updates: riskObsUpdateArray
                                  };
                                  //console.log("prismMultipleRowAndFieldUpdate :",apiparamUpdate);
                                  this.apiService.post('prismMultipleRowAndFieldUpdate', apiparamUpdate)
                                    .subscribe({
                                      next: (updateResult: any) => {
                                        //console.log("✅ Existing Observation Data updated successfully:", updateResult);
                                      },
                                      error: (updateErr) => {
                                        console.error("❌ Error updating Observation Data:", updateErr);
                                      }
                                    });
                                }

                                // ✅ Step 4: Insert new Observation rows
                                if (riskObsInsertArray.length > 0) {
                                  const apiparamInsert = {
                                    table_name: "MEM_GAP_OBSERVATION_DATA",
                                    insertDataArray: riskObsInsertArray
                                  };

                                  this.apiService.post('prismMultipleinsert', apiparamInsert)
                                    .subscribe({
                                      next: (insertRes: any) => {
                                        //console.log("✅ New Observation Data inserted successfully:", insertRes);
                                        if (this.userId !== null) {
                                          //this.loadDashboard(this.userId);
                                          //this.router.navigate(['/dashboard']);
                                          // this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                                          //   this.router.navigate(['/dashboard']);
                                          // });
                                        }

                                        this.isLoading = false;
                                        this.showFlash('Saved Successfully!');
                                        this.modalInstance?.hide(); 
                                        setTimeout(() => {
                                            this.openModal(medicaid_id,this.member_name);
                                        }, 300);
                                            
                                      },
                                      error: (insertErr) => {
                                        console.error("❌ Error inserting Observation Data:", insertErr);
                                        if (this.userId !== null) {
                                          //this.loadDashboard(this.userId);
                                          //this.router.navigate(['/dashboard']);
                                          // this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                                          //   this.router.navigate(['/dashboard']);
                                          // });

                                        }
                                        this.showFlash('Saved Successfully!');
                                        this.isLoading = false;
                                        this.modalInstance?.hide(); 
                                        setTimeout(() => {
                                            this.openModal(medicaid_id,this.member_name);
                                        }, 300);                                      }
                                    });
                                }else{
                                        if (this.userId !== null) {
                                          //this.loadDashboard(this.userId);
                                          //this.router.navigate(['/dashboard']);
                                          // this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                                          //   this.router.navigate(['/dashboard']);
                                          // });

                                        }
                                        this.showFlash('Saved Successfully!');
                                        this.isLoading = false;
                                        this.modalInstance?.hide();
                                        setTimeout(() => {
                                            this.openModal(medicaid_id,this.member_name);
                                        }, 300);
                                      }
                  },
                  error: (updateErr) => {
                    console.error('❌ Error updating quality status:', updateErr);
                    alert('Failed to update quality status!');
                  }
                  
              });
              const subMeasureVal = qualitySubMeasures.length > 0 ? `'${qualitySubMeasures.join("','")}'` : '';
              const qualityparamsupdate = {
                medicaid_id: medicaid_id,
                measur_code_val: subMeasureVal,
                action_id: action_id
              };

              this.apiService.post('prismUpdatequalityStatus', qualityparamsupdate).subscribe({
                  next: (updateRes: any) => {
                    //console.log('✅ Risk status updated successfully:', updateRes);
                    // ✅ Step 3: Update existing Observation rows
                                if (riskObsUpdateArray.length > 0) {
                                  const apiparamUpdate = {
                                    table_name: "MEM_GAP_OBSERVATION_DATA",
                                    id_field_name: "id",
                                    updates: riskObsUpdateArray
                                  };
                                  //console.log("prismMultipleRowAndFieldUpdate :",apiparamUpdate);
                                  this.apiService.post('prismMultipleRowAndFieldUpdate', apiparamUpdate)
                                    .subscribe({
                                      next: (updateResult: any) => {
                                        //console.log("✅ Existing Observation Data updated successfully:", updateResult);
                                      },
                                      error: (updateErr) => {
                                        console.error("❌ Error updating observation data:", updateErr);
                                      }
                                    });
                                }

                                
                  },
                  error: (updateErr) => {
                    console.error('❌ Error updating quality status:', updateErr);
                    alert('Failed to update quality status!');
                  }
                  
              });              
            },
            error: (err) => {
              console.error('❌ Error inserting action:', err);
              alert('Failed to save a action!');
            },
        });

    //console.log('✅ Quality/Risk data update process completed.');
  }
// resetAddActionPopup(medicaid_id: string){

// }
isVisible: Boolean | undefined;
addrVisible: Boolean | undefined;
mobisVisible: Boolean | undefined;
langVisible: Boolean | undefined;
//encounterVisible: Boolean | undefined;
pcpVisible: Boolean | undefined;
  showDetails(medicaid_id: string){ 
    this.isLoading = true; // show loader 
    //alert(medicaid_id);
    const isVisible = true; 
    const addrVisible = true;
    const mobisVisible = true;
    const langVisible = true;
    //const encounterVisible = true;
    const pcpVisible = true;

    const payload = { medicaid_id: medicaid_id };

  this.apiService.post('prismMemberAllDetails', payload).subscribe({
    next: (res: any) => {
      this.memberDetails = res.data.memberDetails || []; 
      this.alt_address = res.data.altaddress || []; 
      this.member_alt_phone_details = res.data.prismMemberaltphone || []; 
      this.all_language_master_list = res.data.prismMasterLanguage || []; 
      this.member_alt_language_details = res.data.prismMemberaltlanguage || []; 
      this.pcp_list = res.data.prismMemberPCPList || []; 
      this.log_details = res.data.logDetails || []; 
      //console.log(this.alt_address);
      const careCoordinatorId = this.memberDetails?.[0]?.Care_Coordinator_id || ''; 
      this.memberInfoFormGroup.patchValue({
        medicaid_id: medicaid_id,
        assign_to: careCoordinatorId
      });

      this.altAddressFormGroup.patchValue({
        medicaid_id: medicaid_id 
      });

      this.altPhoneFormGroup.patchValue({
        medicaid_id: medicaid_id 
      });

      this.altLangFormGroup.patchValue({
        medicaid_id: medicaid_id 
      });

      this.isLoading = false; // hide loader
    },
    error: (err) => {
      console.error('❌ Dashboard load failed:', err);
    }
  });

  this.memberDetailsModal?.show();
  }

  closeMemberdetails(): void {
    this.memberDetailsModal?.hide();
  }

  update_member_info_submit() { 
      this.isLoading = true;  
      const formValue = this.memberInfoFormGroup.value;  
      const updateData = { 
        Care_Coordinator_id: formValue.assign_to,  
        preferred_call_time: formValue.preferred_call_time
      };
      const payload = {
        updateData: updateData,
        table_name: 'MEM_OUTREACH_MEMBERS',
        id_field_name: 'medicaid_id',
        id_field_value: formValue.medicaid_id
      };
      //console.log('Updating record:', payload);

      this.apiService.post('prismMultiplefieldupdate', payload).subscribe({
        next: (res) => {  
          const user = this.auth.getUser();
          const added_by = user?.ID || 0; 
          //console.log('Updating:', res);
          ////////////////// Log entry start //////////////////////
            const LogArray = {
                medicaid_id: formValue.medicaid_id,
                log_name: 'UPDATE MEBER INFO',
                log_details: 'UPDATE MEBER INFO FOR '+ formValue.medicaid_id,
                log_status: 'Success',
                log_by: added_by,
                action_type: 'UPDATE MEBER INFO'
            }; 
            this.add_system_log([LogArray]);
          ///////////////////// Log entry end ///////////////////// 
          this.isLoading = false;  
        },
        error: (err) => {
          console.error('❌ Update API Error:', err);
        }
      });    
  }

  add_alt_address_submit() { 
      this.isLoading = true;  
      const formValues = this.altAddressFormGroup.value; 
      const user = this.auth.getUser();
      const added_by = user?.ID || 0; 
      //console.log(formValues);
      const Payload = {
        table_name: 'MEM_ALT_ADDRESS',
        insertDataArray: [
          {
            medicaid_id: formValues.medicaid_id,
            alt_address: formValues.alt_address,
            alt_city: formValues.alt_city,
            alt_state: formValues.alt_state,
            alt_zip: formValues.alt_zip,
            add_date: formValues.created_date,
            add_by: added_by
          },
        ],
      };     
      this.apiService.post('prismMultipleinsert', Payload).subscribe({
        next: (res) => {   
          this.apiService.post('prismMemberAllDetails', { medicaid_id: formValues.medicaid_id }).subscribe({
            next: (res:any) => { 
             this.alt_address = res.data.altaddress || []; 
             ////////////////// Log entry start //////////////////////
            const LogArray = {
                medicaid_id: formValues.medicaid_id,
                log_name: 'ADD ALTERNATIVE ADDRESS',
                log_details: 'ADD ALTERNATIVE ADDRESS FOR '+ formValues.medicaid_id,
                log_status: 'Success',
                log_by: added_by,
                action_type: 'ADD ALTERNATIVE ADDRESS'
            }; 
            this.add_system_log([LogArray]);
          ///////////////////// Log entry end /////////////////////

             this.altAddressFormGroup.reset(); 
             this.isLoading = false;
            },
            error: (err) => console.error(err)
          });

        },
        error: (err) => {
          console.error('❌ Update API Error:', err);
        }
      });       
  } 

  add_alt_phone_submit(){
      this.isLoading = true;  
      const formValues = this.altPhoneFormGroup.value; 
      const user = this.auth.getUser();
      const added_by = user?.ID || 0; 
      //console.log(formValues);
      const Payload = {
        table_name: 'MEM_ALT_PHONE',
        insertDataArray: [
          {
            medicaid_id: formValues.medicaid_id,
            alt_phone_no: formValues.alt_phone_no, 
            add_by: added_by
          },
        ],
      };     
      this.apiService.post('prismMultipleinsert', Payload).subscribe({
        next: (res) => {   
          //alert(formValues.medicaid_id);
          this.apiService.post('prismMemberAllDetails', { medicaid_id: formValues.medicaid_id }).subscribe({
            next: (res:any) => { 
             this.member_alt_phone_details = res.data.prismMemberaltphone || []; 

             ////////////////// Log entry start //////////////////////
            const LogArray = {
                medicaid_id: formValues.medicaid_id,
                log_name: 'ADD ALTERNATIVE PHONE',
                log_details: 'ADD ALTERNATIVE PHONE FOR '+ formValues.medicaid_id,
                log_status: 'Success',
                log_by: added_by,
                action_type: 'ADD ALTERNATIVE PHONE'
            }; 
            this.add_system_log([LogArray]);
          ///////////////////// Log entry end /////////////////////

             //console.log(this.member_alt_phone_details);
             //this.altPhoneFormGroup.reset(); 
             $('#alt_phone_no').val('');
             this.isLoading = false;
            },
            error: (err) => console.error(err)
          });

        },
        error: (err) => {
          console.error('❌ Update API Error:', err);
        }
      }); 
  } 

  add_alt_language_submit(){
    this.isLoading = true;  
    const formValues = this.altLangFormGroup.value; 
    const user = this.auth.getUser();
    const added_by = user?.ID || 0; 
    //console.log(formValues);

    this.apiService.post('prismMemberlanguage', { medicaid_id: formValues.medicaid_id }).subscribe({
        next: (res:any) => { 
          this.member_alt_language_details = res.data.prismMemberaltlanguage || [];
         // console.log(res.data[0].PRIMARY_LANG); 
           const Payload = {
              table_name: 'MEM_ALT_LANGUAGE',
              insertDataArray: [
                {
                  medicaid_id: formValues.medicaid_id,
                  alt_language: formValues.alt_language_name, 
                  code: formValues.alt_language, 
                  roster_language: res.data[0].LANGUAGE_DESC, 
                  language_code: res.data[0].PRIMARY_LANG, 
                  add_by: added_by
                },
              ],
            };

            this.apiService.post('prismMultipleinsert', Payload).subscribe({
              next: (res) => {   

                this.apiService.post('prismMemberAllDetails', { medicaid_id: formValues.medicaid_id }).subscribe({
                  next: (res:any) => { 
                    this.member_alt_language_details = res.data.prismMemberaltlanguage || []; 
                    ////////////////// Log entry start //////////////////////
                    const LogArray = {
                        medicaid_id: formValues.medicaid_id,
                        log_name: 'ADD ALTERNATIVE LANGUAGE',
                        log_details: 'ADD ALTERNATIVE LANGUAGE FOR '+ formValues.medicaid_id,
                        log_status: 'Success',
                        log_by: added_by,
                        action_type: 'ADD ALTERNATIVE LANGUAGE'
                    }; 
                    this.add_system_log([LogArray]);
                  ///////////////////// Log entry end /////////////////////
                  
                    $('#alt_language').val('');
                    this.isLoading = false;
                  },
                  error: (err) => console.error(err)
                });
                

              },
              error: (err) => {
                console.error('❌ Update API Error:', err);
              }
            });  
          
        },
      error: (err) => console.error(err)
    }); 

  }

  get_language_name(event: any) {
      const selectedCode = event.target.value;
      const lang = this.all_language_master_list.find(
        x => x.LANGUAGE_CD === selectedCode
      );

      const selectedName = lang ? lang.LANGUAGE_DESC : ''; 
      this.altLangFormGroup.patchValue({
        alt_language_name: selectedName
      });
  }

   
}

