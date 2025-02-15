import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup,Validators } from '@angular/forms';
import { NoteService } from '../note.service';
import { Note } from '../note';
import { Observable } from 'rxjs';
import { Firestore, collection, query, where, getDocs, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.css']
})
export class NoteComponent implements OnInit {

  noteForm!:FormGroup;
  editForm!:FormGroup;
  noteDetails:any;
  notes$!: Observable<Note[]>; 
  notesData:Note[]=[];
  searchTerm: string = '';

  noteObj:Note={
    id: '',
    note_title: '',
    note_desc: '',
    order:0
  }

  constructor(private fb:FormBuilder,private noteService:NoteService,private fireStore: Firestore ) { 
    this.noteForm=this.fb.group({
      title:['',Validators.required],
      description:['',Validators.required]
    });
    this.editForm=this.fb.group({
      edit_title:['',Validators.required],
      edit_description:['',Validators.required]
    })
  }

  ngOnInit(): void {
this.getAllNotes();
  }

  addNote() {
    const { value } = this.noteForm;
    console.log(value);
    
    this.noteObj.id = '';
    this.noteObj.note_title = value.title;
    this.noteObj.note_desc = value.description;
    this.noteObj.order = this.notesData.length; // Assign the next order value
    this.noteObj.createdAt = new Date();
  
    this.noteService.addNote(this.noteObj)
      .then(() => {
        alert("Note Added Successfully");
        this.noteForm.reset();
      })
      .catch((error) => {
        console.error("Error adding note:", error);
        alert("Failed to add note");
      });
  }
  
// Get all data

getAllNotes(): void {
  
  this.noteService.getNotes().subscribe((res: Note[]) => {
    // Sort notes by their order property
    this.notesData = res.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    console.log('Notes fetched and sorted:', this.notesData);
  });
}

// Handle drop event and update the order in Firebase
onDrop(event: CdkDragDrop<Note[]>): void {
  const previousIndex = event.previousIndex;
  const currentIndex = event.currentIndex;

  // Reorder locally
  moveItemInArray(this.notesData, previousIndex, currentIndex);

  // Update the order in Firebase
  this.notesData.forEach((note, index) => {
    note.order = index; // Assign the new order based on array index
    const notesCollectionRef = collection(this.fireStore, 'Notes');
    const q = query(notesCollectionRef, where('id', '==', note.id));

    // Update each note's order in Firebase
    getDocs(q).then((querySnapshot) => {
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        updateDoc(docRef, { order: note.order })
          .then(() => console.log(`Updated order for note with ID: ${note.id}`))
          .catch((error) => console.error(`Error updating order: ${error}`));
      }
    });
  });

  console.log('Reordering completed and saved to Firebase');
}


deleteNote(note: Note): void {
  console.log("Deleting note with ID:", note.id);

  const decision = confirm("Are you sure you want to delete this Note?");
  if (decision) {
    const notesCollectionRef = collection(this.fireStore, 'Notes');

    // Query the collection for a document with the matching id field
    const q = query(notesCollectionRef, where('id', '==', note.id));

    // Fetch the document
    getDocs(q)
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;  // Get the first matching document

          // Delete the document
          deleteDoc(docRef)
            .then(() => {
              console.log('Note successfully deleted');
              this.getAllNotes();  // Refresh the list after deletion
            })
            .catch((error) => {
              console.error('Error deleting note:', error);
              alert('Failed to delete the note');
            });
        } else {
          console.log('No document found with the given id field!');
          alert('Note not found!');
        }
      })
      .catch((error) => {
        console.error('Error fetching documents:', error);
        alert('Error fetching document');
      });
  }
}
  fs(fs: any, arg1: string) {
    throw new Error('Method not implemented.');
  }


// get all details
getAllDetails(note:Note)
{
  this.noteDetails=note;
  console.log(this.noteDetails);
  
}

// update note

updateNote(note: Note): void {
  console.log("Updating note with ID:", note.id);

  // Collecting updated data from the form, but only if the form fields are not empty
  const updatedNoteData: any = {};

  // Check if the title field is not empty before updating it
  if (this.editForm.value.edit_title) {
    updatedNoteData.note_title = this.editForm.value.edit_title;
  } else {
    updatedNoteData.note_title = note.note_title;  // Keep the original title if the form field is empty
  }

  // Check if the description field is not empty before updating it
  if (this.editForm.value.edit_description) {
    updatedNoteData.note_desc = this.editForm.value.edit_description;
  } else {
    updatedNoteData.note_desc = note.note_desc;  // Keep the original description if the form field is empty
  }

  // Optionally, you can update the timestamp
  updatedNoteData.updatedAt = new Date();

  const notesCollectionRef = collection(this.fireStore, 'Notes');
  const q = query(notesCollectionRef, where('id', '==', note.id));

  getDocs(q)
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;  // Get the first matching document

        // Update the document with the new data
        updateDoc(docRef, updatedNoteData)
          .then(() => {
            alert('Note successfully updated');
            this.getAllNotes();  // Refresh the list after update
            this.editForm.reset();
            // this.noteObj = { id: '', note_title: '', note_desc: '' }; // Clear the model data for the note
          })
          .catch((error) => {
            console.error('Error updating note:', error);
            alert('Failed to update the note');
          });
      } else {
        console.log('No document found with the given id field!');
        alert('Note not found!');
      }
    })
    .catch((error) => {
      console.error('Error fetching documents:', error);
      alert('Error fetching document');
    });
}


}
