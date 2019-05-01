import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AppInfoService} from '../../../services/app-info.service';
import {ButtonModel} from '../../../universal/app.types';

@Component({
  selector: 'app-keypad-button-style',
  templateUrl: './keypad-button-style.component.html',
  styleUrls: ['./keypad-button-style.component.css']
})
export class KeypadButtonStyleComponent implements OnInit {
  buttonModel: ButtonModel = new ButtonModel();
  @ViewChild('mybutton') buttonRef: ElementRef;
  paperButton: any ;

  constructor(public appInfo: AppInfoService) {

  }

  ngOnInit() {
    this.paperButton = this.buttonRef.nativeElement;
  }

}
