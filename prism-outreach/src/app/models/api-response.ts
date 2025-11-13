export interface ApiResponse {
    statusCode: number;
    data: any[];
}
export interface ApiResponseAllmyworkspace {
  statusCode: number;
  data: {
    planList: never[];
    referralList: any[];
    recentActivity: any[]; 
    departmentList?: any[];
    members?: any[];
    overallRiskQualitySummary?: any[];
    ownRiskQualitySummary?: any[];
  }
}
export interface ApiResponseMemberGapsList {
  statusCode: number;
  data: {
    prismGapList?: any[];
    prismQualityList?: any[];
  }
}
export interface AddActionMasterData {
  statusCode: number;
  data: {
    actionActivityCategory?: any[];
    actionActivityType?: any[];
    navigatorList?: any[];
  }
}

export interface ApiResponseTaskdata {
  statusCode: number;
  data: { 
    actionActivityType?: any[];
    navigatorList?: any[];
  }
}

export interface ProviderPerformance {
  priority_count: number;
  call_count: number;
  other_count: number;
  other_call_count: number;
  priority_gaps_count: number;
  priority_complete_gaps_count: number;
  other_gaps_count: number;
  other_complete_gaps_count: number;
  priority_quality_gaps_count: number;
  priority_complete_quality_gaps_count: number;
  other_quality_gaps_count: number;
  other_complete_quality_gaps_count: number;
  priority_pcp_visit_count: number;
  other_pcp_visit_count: number;
  priority_percentage: number;
  priority_color: string;
  other_call_percentage: number;
  other_call_color: string;
  priority_gaps_percentage: number;
  priority_gaps_color: string;
  other_gaps_percentage: number;
  other_gaps_color: string;
  priority_quality_gaps_percentage: number;
  priority_quality_gaps_color: string;
  other_quality_gaps_percentage: number;
  other_quality_gaps_color: string;
  priority_pcp_visit_percentage: number;
  priority_pcp_visit_color: string;
  other_pcp_visit_percentage: number;
  other_pcp_visit_color: string;
  provider_name: string;
}

export interface Altaddress {
  medicaid_id: string;
  alt_address: string;
  alt_city: string;
  alt_state: string;
  alt_zip: string;
  add_date: string;
  initial:string;
  
}
