import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, KeyValue } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../services/api.service';
import type {
  ApiResponse,
  UserRiskLevels,
  TopRiskLevel,
  RiskLevel
} from '../../models/api-response';

declare var $: any;

// Lightweight local interfaces for template-friendly structure
interface ScoreItem { date: string; score: number; level: string; }
interface ItemRow { category: string; sub_category: string; specific: string; scores_list: ScoreItem[]; }
interface MemberRow {
  medicaidId: string;
  last_action_date?: string;
  next_upcoming_date?: string;
  totalPerDate: Record<string, number>;
  items: ItemRow[];
  totalRiskCount: number;
  assignedLevel: string;
}
interface UserGroup {
  user_name: string;
  memberCount: number;
  risk_levels: { risk_lvl_name: string; members: MemberRow[] }[];
}

@Component({
  selector: 'app-latest-risk-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './latest-risk-profile.html',
  styleUrl: './latest-risk-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LatestRiskProfile implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // UI state
  isLoading = false;
  selectedUser = '';
  user_list: any[] = [];
  riskLevel: RiskLevel[] = [];
  dateHeaders: string[] = [];

  // pre-computed structure used by the template (fast reads, no searches)
  userGroups: UserGroup[] = [];

  // expand/collapse
  openUser: Record<string, boolean> = {};
  openRisk: Record<string, boolean> = {};
  openMember: Record<string, boolean> = {};
  riskOrder: any;
  

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadData(0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetState() {
    this.userGroups = [];
    this.user_list = [];
    this.riskLevel = [];
    this.dateHeaders = [];
    this.openUser = {};
    this.openRisk = {};
    this.openMember = {};
  }

  

  search() {
    // reset and load
    this.resetState();
    this.loadData(+this.selectedUser);
  }

  loadData(user_id: number) {
    const now = new Date();
    console.log("API Call Start:", now);
    this.isLoading = true;
    this.api.post<ApiResponse>('prismMemberriskprofile', { user_id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (!res?.data) {
            alert('No data found.');
            
            return;
          }
          // raw arrays
          const monthly_score_data = res.data.riskSummary ?? [];
          this.user_list = res.data.userlist ?? [];
          this.riskLevel = res.data.riskLevel ?? [];

          const now = new Date();
          console.log("API Call End:", now);
          // Build optimized structure          
          this.buildStructures(monthly_score_data);          
         // this.initDataTable(); 
          this.cdr.markForCheck();
          this.isLoading = false;
          const now3 = new Date();
          console.log("End:", now3); 
          
        },
        error: () => {
          alert('Server error. Please try again later.');
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Convert incoming rows into a pre-baked structure:
   * userGroups[] -> risk_levels[] -> members[] -> items[] -> scores_list[]
   *
   * This avoids expensive lookups in the template, and supports O(N) processing only.
   */
  
  private buildStructures(rows: any[]) {
    const now1 = new Date();
    console.log("Component Loop Start:", now1);

    // Maps for quick accumulation
    const dateSet = new Set<string>();
    type UserMap = Record<string, {
      memberMap: Record<string, {
        last_action_date?: string;
        next_upcoming_date?: string;
        totalPerDate: Record<string, number>;
        itemsMap: Record<string, ItemRow>;
      }>;
    }>;
    const users: UserMap = {};

    // First pass: normalize rows into maps
    for (const r of rows) {
      const user = (r.Care_Coordinator_name || 'UNKNOWN').trim();
      const memberId = String(r.medicaid_id);
      const cat = r.risk_category ?? '';
      const sub = r.sub_category_name ?? '';
      const specific = r.sub_category2_name ?? '';
      const rawDate = r.to_date ?? '';
      // normalize to YYYY-MM-DD if contains T
      const date = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
      date && dateSet.add(date);
      const score = Number(r.score ?? 0);
      const level = r.level ?? '';

      users[user] ??= { memberMap: {} };
      const memberObj = users[user].memberMap[memberId] ??= {
        last_action_date: r.last_action_date ?? '',
        next_upcoming_date: r.next_upcoming_date ?? '',
        totalPerDate: {},
        itemsMap: {}
      };

      // accumulate totals per date for member
      memberObj.totalPerDate[date] = (memberObj.totalPerDate[date] ?? 0) + score;

      // compose a unique key for item (category|sub|specific)
      const itemKey = `${cat}||${sub}||${specific}`;
      memberObj.itemsMap[itemKey] ??= {
        category: cat,
        sub_category: sub,
        specific,
        scores_list: []
      };

      // push score entry for this item
      memberObj.itemsMap[itemKey].scores_list.push({ date, score, level });
    }

    // Sort dates stable ascending
    this.dateHeaders = Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Build final userGroups array
    this.userGroups = [];
    for (const [userName, uObj] of Object.entries(users)) {
      const topRiskLevels = (this.riskLevel && this.riskLevel.length)
        ? this.riskLevel.map(rl => ({ risk_lvl_name: rl.level, members: [] as MemberRow[] }))
        : [];

      // For each member compute totals and assigned level
      for (const [memberId, mObj] of Object.entries(uObj.memberMap)) {
        // compute last date total (last header) or 0
        const lastDate = this.dateHeaders.length ? this.dateHeaders[this.dateHeaders.length - 1] : '';
        const totalAtLast = lastDate ? (mObj.totalPerDate[lastDate] ?? 0) : 0;

        // determine assigned level using ranges in this.riskLevel
        let assigned = this.riskLevel.length ? this.riskLevel[this.riskLevel.length - 1].level : 'Unknown';
        for (let i = 0; i < this.riskLevel.length; i++) {
          const rl = this.riskLevel[i];
          const low = Number(rl.range_from ?? 0);
          const high = Number(rl.range_to ?? 0);
          const isLast = (i === this.riskLevel.length - 1);
          if ((low <= totalAtLast && totalAtLast < high) || (isLast && totalAtLast <= high)) {
            assigned = rl.level;
            break;
          }
        }

        // Build items array (scores_list already per item)
        const items = Object.values(mObj.itemsMap).map(it => {
          // ensure every date appears only once; if multiple entries for same date exist, they remain as separate entries
          return {
            category: it.category,
            sub_category: it.sub_category,
            specific: it.specific,
            scores_list: this.dateHeaders.length ? this.dateHeaders.map(d => {
              // find an entry for this date in scores_list (there may be 0 or 1)
              const found = it.scores_list.find(s => s.date === d);
              return found ? { ...found } : { date: d, score: 0, level: '' };
            }) : it.scores_list
          } as ItemRow;
        });

        const memberRow: MemberRow = {
          medicaidId: memberId,
          last_action_date: mObj.last_action_date,
          next_upcoming_date: mObj.next_upcoming_date,
          totalPerDate: { ...mObj.totalPerDate },
          items,
          totalRiskCount: totalAtLast,
          assignedLevel: assigned
        };

        // push into right topRiskLevels bucket
        const bucket = topRiskLevels.find(t => t.risk_lvl_name === assigned);
        if (bucket) bucket.members.push(memberRow);
        else { // fallback to first bucket if config mismatch
          (topRiskLevels[0] ??= { risk_lvl_name: 'Unknown', members: [] }).members.push(memberRow);
        }
      }

      // filter out empty risk level groups (optional) and count members
      const finalLevels = topRiskLevels.map(l => ({ risk_lvl_name: l.risk_lvl_name, members: l.members }));
      const memberCount = finalLevels.reduce((acc, lv) => acc + lv.members.length, 0);

      this.userGroups.push({
        user_name: userName,
        memberCount,
        risk_levels: finalLevels
      });
      const now2 = new Date();
      console.log("Sorting start:", now2);

      this.buildRiskOrder();

      const now4 = new Date();
      console.log("Sorting end:", now4);

      // default open state for UI
      this.openUser[userName] = true;
      for (const lvl of finalLevels) {
        this.openRisk[`${userName}::${lvl.risk_lvl_name}`] = true;
      }
    }

    // sort userGroups alphabetically
    this.userGroups.sort((a, b) => a.user_name.localeCompare(b.user_name));

    const now5 = new Date();
    console.log("Component Loop End:", now5);
  }

  // Template helpers
  trackByUser(_: number, item: UserGroup) { return item.user_name; }
  trackByRisk(_: number, item: { risk_lvl_name: string }) { return item.risk_lvl_name; }
  trackByMember(_: number, m: MemberRow) { return m.medicaidId; }
  trackByItem(_: number, it: ItemRow) { return `${it.category}||${it.sub_category}||${it.specific}`; }

  toggleUser(user: string) { this.openUser[user] = !this.openUser[user]; }
  toggleRisk(user: string, lvl: string) { this.openRisk[`${user}::${lvl}`] = !this.openRisk[`${user}::${lvl}`]; }
  toggleMember(id: string) { 
    this.openMember[id] = !this.openMember[id]; }

  // safe date display (avoid 1/1/1900)
  formatDate(dateStr?: string) {
    if (!dateStr) return '';
    // quick check for empty/1900
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    if (d.getFullYear() === 1900) return '';
    // Use the browser locale short date
    return d.toLocaleDateString();
  }

  getScoreClass(level: string) {
    return {
      'bg-success': level === 'Low',
      'bg-warning': level === 'Medium',
      'bg-danger': level === 'High'
    };
  }

//   getGlobalRiskCategoryCount() {
//   const counts = {
//     'STABLE HEALTHY L1': 0,
//     'STABLE HEALTHY L2': 0,
//     'AT RISK (L1)': 0,
//     'STRUGGLING (L2)': 0,
//     'IN CRISIS (L3)': 0
//   };

//   for (const user of this.userGroups) {
//     for (const lvl of user.risk_levels) {
//       const count = lvl.members.length;

//       switch (lvl.risk_lvl_name.trim()) {
//         case 'STABLE HEALTHY L1':
//           counts['STABLE HEALTHY L1'] += count;
//           break;

//         case 'STABLE HEALTHY L2':
//           counts['STABLE HEALTHY L2'] += count;
//           break;

//         case 'AT RISK (L1)':
//           counts['AT RISK (L1)'] += count;
//           break;

//         case 'STRUGGLING (L2)':
//           counts['STRUGGLING (L2)'] += count;
//           break;

//         case 'IN CRISIS (L3)':
//           counts['IN CRISIS (L3)'] += count;
//           break;
//       }
//     }
//   }

//   return counts;
// }

// Desired order (top to bottom)
 

sortRiskCategories(a: KeyValue<string, number>, b: KeyValue<string, number>): number {
  if (!this.riskOrder || this.riskOrder.length === 0) {
    return 0; // do not sort yet
  }
  
  const posA = this.riskOrder.indexOf(a.key);
  const posB = this.riskOrder.indexOf(b.key);

  return posA < posB ? -1 : 1;
}

buildRiskOrder() {
  const orderSet = new Set<string>();

  for (const user of this.userGroups) {
    for (const lvl of user.risk_levels) {
      const name = lvl.risk_lvl_name?.trim() || '';
      if (name) orderSet.add(name);
    }
  }

  // Convert Set → Array (preserves order)
  this.riskOrder = Array.from(orderSet);
}


getGlobalRiskCategoryCount() {
  const counts: Record<string, number> = {};

  for (const user of this.userGroups) { 
    for (const lvl of user.risk_levels) {
      const levelName = lvl.risk_lvl_name?.trim() || '';
      const count = lvl.members?.length || 0;

      // Initialize if not exist
      if (!counts[levelName]) {
        counts[levelName] = 0;
      }

      // Add members count
      counts[levelName] += count;
    }
  }

  return counts;
}
getRiskColor(level: string): string {
  const map: Record<string, string> = {
    'STABLE HEALTHY L1': '#e8f5e9',
    'STABLE HEALTHY L2': '#dcedc8',
    'AT RISK L1': '#fff9c4',
    'STRUGGLING L2': '#ffe0b2',
    'IN CRISIS L3': '#ffccbc'
  };

  return map[level] || '#eee'; // default color
}
 

initDataTable() {
  setTimeout(() => {
    if ($.fn.DataTable.isDataTable('#member_risk_profile_table')) {
      $('#member_risk_profile_table').DataTable().destroy();
    }

    $('#member_risk_profile_table').DataTable({
      dom: '<"d-flex justify-content-between align-items-center"lf>t<"d-flex justify-content-between"ip>',
      language: {
        search: "_INPUT_",
        searchPlaceholder: "Search",
      },

      rowCallback: (row: Node) => {
        const $row = $(row);

        // find element with attribute
        const toggleCell = $row.find('[data-toggle-member]');

        if (toggleCell.length) {
          toggleCell.off('click').on('click', () => {
            const id = toggleCell.attr('data-toggle-member');
            this.toggleMember(id);
            this.cdr.detectChanges();
          });
        }
      }

    });

  }, 300);
} 

}
