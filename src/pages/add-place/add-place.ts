import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ModalController, LoadingController, ToastController } from 'ionic-angular';
import { NgForm } from "@angular/forms";
import { Geolocation } from '@ionic-native/geolocation';
import { Camera } from '@ionic-native/camera';
import { File, Entry, FileError } from '@ionic-native/file';
import { SetLocationPage } from "../set-location/set-location";
import { Location } from '../../models/location';
import { PlacesService } from "../../services/places.service";

declare var cordova: any;

@IonicPage()
@Component({
  selector: 'page-add-place',
  templateUrl: 'add-place.html',
})
export class AddPlacePage {
  location: Location = {
    lat: 40.7624324,
    long: -73.9759827
  };
  locationIsSet = false;
  imageUrl = '';
  constructor(private mdlCtrl: ModalController,
    private geolocation: Geolocation,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private camera: Camera,
    private placesService: PlacesService,
    private file: File) { }
  onSubmit(form: NgForm) {
    this.placesService.addPlace(form.value.title, form.value.description, this.location, this.imageUrl);
    form.reset();
    this.location = {
      lat: 40.7624324,
      long: -73.9759827
    };
    this.imageUrl = '';
    this.locationIsSet = false;
  }

  onOpenMap() {
    const modal = this.mdlCtrl.create(SetLocationPage, { location: this.location, isSet: this.locationIsSet });
    modal.present();
    modal.onDidDismiss((data) => {
      if (data) {
        this.location = data.location;
        this.locationIsSet = true;
      }
    })
  }

  onLocate() {
    const loading = this.loadingCtrl.create({
      content: 'locating..'
    });
    loading.present();
    this.geolocation.getCurrentPosition()
      .then(
      location => {
        loading.dismiss();
        console.log(location);
        this.location.lat = location.coords.latitude;
        this.location.long = location.coords.longitude;
        this.locationIsSet = true;
      }
      )
      .catch(
      error => {
        loading.dismiss();
        console.log(error);
        const toast = this.toastCtrl.create({
          message: 'Could not get location',
          duration: 2500
        });
        toast.present();
      }
      );
  }

  onTakePhoto() {
    this.camera.getPicture({
      encodingType: this.camera.EncodingType.JPEG,  //default is jpeg anyway
      correctOrientation: true
    })
      .then(
      imageData => {
        const currentName = imageData.replace(/^.*[\\\/]/, '');
        const path = imageData.replace(/[^\/]*$/, '');
        const newFileName = new Date().getMilliseconds() + '.jpg';
        this.file.moveFile(path, currentName, cordova.file.dataDirectory, newFileName)
          .then(
            (data: Entry) => {
              this.imageUrl = data.nativeURL;
              this.camera.cleanup();
              //this.file.removeFile(path, currentName);
            }
          )
          .catch(
          (err: FileError) => {
            this.imageUrl = '';
            const toast = this.toastCtrl.create({
              message: 'Could not save the image. Please try again!',
              duration: 2500
            });
            toast.present();
            this.camera.cleanup();
          }
          );
        this.imageUrl = imageData;
      }
      )
      .catch(
      error => {
        const toast = this.toastCtrl.create({
          message: 'Could not take the image. Please try again!',
          duration: 2500
        });
        toast.present();
      }
      );
  }
}
