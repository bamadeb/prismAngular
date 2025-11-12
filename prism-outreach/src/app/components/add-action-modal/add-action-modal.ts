import { Component, Input } from '@angular/core';
declare var bootstrap: any;

@Component({
  selector: 'app-add-action-modal',
  templateUrl: './add-action-modal.html'
})
export class AddActionModalComponent {
  @Input() selPanelList: any[] = [];
  @Input() selPanelType: any[] = [];

  todo = { activityCategory: '', activityType: '', actionDate: '', note: '' };
  appointment = { vendorName: '', date: '', note: '' };

  openModal() {
    const modalEl = document.getElementById('largeModal');
    const myModal = new bootstrap.Modal(modalEl);
    myModal.show();
  }

  closeModal() {
    const modalEl = document.getElementById('largeModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();
  }

  submitTodo() {
    console.log('✅ To-Do submitted:', this.todo);
    this.closeModal();
  }

  submitAppointment() {
    console.log('✅ Appointment submitted:', this.appointment);
    this.closeModal();
  }
}
