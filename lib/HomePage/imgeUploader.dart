import 'package:flutter/material.dart';
import 'package:flutter_easyloading/flutter_easyloading.dart';

import 'package:image_picker/image_picker.dart';
import 'dart:io';

class ImageManager with ChangeNotifier {
  var url;
  var _pickedImage;
  @override
  void addImage(text, context) async {
    final ImagePicker _picker = ImagePicker();
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      _pickedImage = File(image.path);
      // Here you can upload/store the file as needed
      EasyLoading.showSuccess('Document Saved!');
      notifyListeners();
    } else {
      EasyLoading.showInfo('No image selected');
    }
  }

  void pickImageCamera(text, context) async {
    final ImagePicker _picker = ImagePicker();
    final XFile? image = await _picker.pickImage(source: ImageSource.camera);
    if (image != null) {
      _pickedImage = File(image.path);
      EasyLoading.showSuccess('Document Saved!');
      notifyListeners();
    } else {
      EasyLoading.showInfo('No image captured');
    }
  }

  void pickImageGallery(text, context) async {
    addImage(text, context);
  }
}
