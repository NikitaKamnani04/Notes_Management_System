import { Injectable } from '@angular/core';
import {Note} from './note';
// import { collectionData, Firestore } from '@angular/fire/firestore';
// import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';......this contains issues so i declare the below 
import { Firestore, collection, collectionData, query, addDoc, doc, deleteDoc, updateDoc, getDocs, orderBy } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  firestore: any;
 
  constructor(private fs: Firestore) { }

  // Add new note 
  addNote(note: Note) {
    const notesRef = collection(this.fs, 'Notes'); // Collection reference
    note.id = doc(notesRef).id; // Generate unique ID
    return addDoc(notesRef, note); // Add note to Firestore
  }
  
  // get all notes from database
 
  getNotes(): Observable<Note[]> {
    const notesRef = collection(this.fs, 'Notes');
    const q = query(notesRef, orderBy('note_title'));  // Example of query (ordering by note title)
    return from(getDocs(q).then((querySnapshot) => {
      const notes: Note[] = [];
      querySnapshot.forEach((docSnapshot) => {
        notes.push({ id: docSnapshot.id, ...docSnapshot.data() } as Note);
      });
      return notes;
    }));
  }



   // Update the order of notes in Firestore 
  
   updateNoteOrder(notes: any[]): Promise<void[]> {
    const batch = this.firestore.firestore.batch();
    notes.forEach((note, index) => {
      const noteRef = this.firestore.doc(`notes/${note.id}`).ref;
      batch.update(noteRef, { order: index });  // Update order field
    });
    return batch.commit();  // Commit batch to Firestore
  }
  

  // delete notes from database

  deleteNote(note: Note) {
    const noteDocRef = doc(this.fs, `Notes/${note.id}`);
    console.log(`Deleting note with ID: ${note.id}`);  // Log the ID being deleted
    return deleteDoc(noteDocRef);
  }
  
  
  
  // update notes from database
 
  updateNote(note: Note, updatedFields: any): Promise<void> {
    const docRef = doc(this.fs, `Notes/${note.id}`);
    console.log(`Updating note with ID: ${note.id}`);  // Log the ID being updated
    return updateDoc(docRef, updatedFields);
  }
  

}  