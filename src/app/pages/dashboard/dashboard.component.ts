import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Photo } from 'src/app/models/photo.model';
import { GalleryService } from 'src/app/services/gallery.service';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  photoForm: FormGroup;
  selectedFile: any;
  isEditing: boolean = false;
  photoData!: Observable<Photo[]>;

  ngOnInit(): void {
    this.getData();
  }

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private galleryService: GalleryService) {
    this.photoForm = this.fb.group({
      id: [null],
      title: ['', [Validators.required, Validators.minLength(7)]],
      description: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(300)]],
      imageUrl: [''],
      likes: [0]
    });
  }
  hasError(fieldName: string, errorName: string) {
    const fieldErrors = this.photoForm.get(fieldName)?.errors;
    return fieldErrors ? fieldErrors[errorName] : false;
  }
  showErrorMessage(fieldName: string) {
    const fieldControl = this.photoForm.get(fieldName);
    if (fieldControl?.invalid && fieldControl?.touched) {
      if (this.hasError(fieldName, 'required')) {
        return 'Ce champ est requis.';
      } else if (this.hasError(fieldName, 'minlength')) {
        return 'Doit contenir au moins 7 caractères.';
      } else if (this.hasError(fieldName, 'maxlength')) {
        return 'Doit contenir moins de 300 caractères.';
      }
    }
    return '';
  }
  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }
  // onSubmit() {
  //   console.log(this.photoForm.value);
  // }

  saveData() {
    if (this.photoForm.valid) {
      const formData: Photo = this.photoForm.value;
      if (this.selectedFile) {
        const storage = getStorage();
        const storageRef = ref(storage, 'images/' + this.selectedFile.name);
        uploadBytes(storageRef, this.selectedFile).then((snapshot) => {
          getDownloadURL(snapshot.ref).then((downloadURL) => {
            formData.imageUrl = downloadURL;
            this.galleryService.savePhoto(formData).then(() => {
              // this.resetForm();
            });
          });
        });
      } 
    } else {
      console.log('Tous les champs sont requis');
    }
  }

  getData() {
    this.photoData = this.galleryService.getPhotos();
  }
  
  editData(data: Photo) {
    this.isEditing = true;
    this.photoForm.patchValue(data);
  }

  deleteData(id: string) {
    if (confirm('Voulez-vous vraiment supprimer cet élément ?')) {
      this.galleryService.deletePhoto(id)
        .then(() => {
          // Traitement du succès de la suppression
          this.getData(); // Rafraîchit la liste des photos
          alert('La photo a été supprimée avec succès.');
        })
        .catch(error => {
          // Gestion des erreurs
          alert('Une erreur est survenue lors de la suppression de la photo.');
          console.error("Error deleting photo:", error);
        });
    }  
  }
}
