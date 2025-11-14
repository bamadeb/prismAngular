import { Routes } from '@angular/router';
import { Login } from './views/login/login';
import { Dashboard } from './views/dashboard/dashboard';
import { Starperformance } from './views/starperformance/starperformance';
import { GapsReportComponent  } from './views/gapsreport/gapsreport';
import { RiskProfile } from './views/risk-profile/risk-profile';
import { Users } from './views/users/users';
import { Plans } from './views/plans/plans';
import { Processmember } from './views/processmember/processmember';
import { Processriskgap } from './views/processriskgap/processriskgap';
import { Processquality } from './views/processquality/processquality';
import { Fileprocesslogreport } from './views/fileprocesslogreport/fileprocesslogreport';
import { Memberdetails } from './views/memberdetails/memberdetails';
import { AuthLayout } from './layout/auth-layout/auth-layout';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
    {
    path: '',
    component: AuthLayout,
    children: [ 
      { path: '', component: Login , data: { title: 'Login' }},
      { path: 'login', component: Login , data: { title: 'Login' }},
    ]
  },
  {
    path: 'login',
    component: AuthLayout,
    children: [ 
      { path: 'login', component: Login , data: { title: 'Login' }},
    ]
  },
  {
    path: 'dashboard',
    component: MainLayout,
    children: [
      { path: '', component: Dashboard, data: { title: 'MY WORK' }}
    ]
  },
{
    path: 'starperformance',
    component: MainLayout,
    children: [  
      { path: '', component: Starperformance , data: { title: 'STAR PERFORMANCE' }},
    ]
  },{
    path: 'gapsreport',
    component: MainLayout,
    children: [ 
      { path: '', component: GapsReportComponent  , data: { title: 'RISKS GAP REPORT' }},
    ]
  },{
    path: 'riskprofile',
    component: MainLayout,
    children: [ 
      { path: '', component: RiskProfile , data: { title: 'MEMBER RISK PROFILE' }},
    ]
  },{
    path: 'users',
    component: MainLayout,
    children: [ 
      { path: '', component: Users , data: { title: 'USERS MANAGE' }},
    ]
  },{
    path: 'plans',
    component: MainLayout,
    children: [ 
      { path: '', component: Plans , data: { title: 'PLANS MANAGE' }},
    ]
  },{
    path: 'processmember',
    component: MainLayout,
    children: [ 
      { path: '', component: Processmember , data: { title: 'PROCESS MEMBER FILE' }},
    ]
  },{
    path: 'processriskgap',
    component: MainLayout,
    children: [ 
      { path: '', component: Processriskgap , data: { title: 'PROCESS RISK GAPS FILE' }},
    ]
  }, {
    path: 'processquality',
    component: MainLayout,
    children: [ 
      { path: '', component: Processquality , data: { title: 'PROCESS QUALITY GAPS FILE' }},
    ]
  }, {
    path: 'fileprocesslogreport',
    component: MainLayout,
    children: [ 
      { path: '', component: Fileprocesslogreport , data: { title: 'FILE PROCESS LOG REPORT' }},
    ]
  }, {
    path: 'memberdetails',
    component: MainLayout,
    children: [ 
      { path: '', component: Memberdetails , data: { title: 'MEMBER DETAILS' }},
    ]
  }, 
  

    // { path: '', component: Login, data: { title: 'Login' } },
    // { path: 'login', component: Login , data: { title: 'Login' }},
    // { path: 'dashboard', component: Dashboard , data: { title: 'MY WORK' }},
    // { path: 'starperformance', component: Starperformance , data: { title: 'STAR PERFORMANCE' }},
    // { path: 'gapsreport', component: Gapsreport , data: { title: 'RISKS GAP REPORT' }},
    // { path: 'riskprofile', component: RiskProfile , data: { title: 'MEMBER RISK PROFILE' }},
    // { path: 'users', component: Users , data: { title: 'USERS MANAGE' }},
    // { path: 'plans', component: Plans , data: { title: 'PLANS MANAGE' }},
    // { path: 'processmember', component: Processmember , data: { title: 'PROCESS MEMBER FILE' }},
    // { path: 'processriskgap', component: Processriskgap , data: { title: 'PROCESS RISK GAPS FILE' }},
    // { path: 'processquality', component: Processquality , data: { title: 'PROCESS QUALITY GAPS FILE' }},
    // { path: 'fileprocesslogreport', component: Fileprocesslogreport , data: { title: 'FILE PROCESS LOG REPORT' }},
    //{ path: 'memberdetails', component: Memberdetails , data: { title: 'MEMBER DETAILS' }},
    { path: '**', redirectTo: '' }
];
