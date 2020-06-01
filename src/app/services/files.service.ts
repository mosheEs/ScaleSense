import { Injectable } from '@angular/core';
import * as firebase from 'firebase/app';
import 'firebase/storage';
import Reference = firebase.storage.Reference;

/**
 * This service is in charge of uploading files to the server's storage and deleting them.
 * After an image file was uploaded, there is no need to download it, but using it's URL to show it.
 */

@Injectable({
  providedIn: 'root'
})
export class FilesService {

  constructor(
  ) { }

  /** All the files will be stored in the directory "images" */
  get storageRef() {
    return firebase.storage().ref('images');
  }

  /** Upload a file and get it's URL */
  async uploadFile(file: File, fileName: string) : Promise<string> {

    if(!file)
      return;

    // Store the file under its Object's ID
    const ref = this.storageRef.child(fileName);

    // Upload the file and return the download URL
    try {
      const res = await ref.put(file);
      if(res)
        return res.ref.getDownloadURL();
    }
    catch (e) {
      console.error(e);
    }

  }


  /** Delete file by its URL or by its name */
  async deleteFile(idOrUrl: string) {

    let ref: Reference;

    // Delete file by its URL
    if(idOrUrl.includes('/'))
      ref = firebase.storage().refFromURL(idOrUrl);

    // Delete file by its object's ID
    else
      ref = this.storageRef.child(idOrUrl);

    try {
      await ref.delete();
    }
    catch (e) {
      console.log('No file to delete')
    }

  }


  /** Read file for preview */
  static ReadFile(file: File) : Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (e)=> {
        console.error(e);
        reject(e);
      };
      reader.readAsDataURL(file);
    });
  };

  static CreateFile(dataUrl, filename) : File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

}
