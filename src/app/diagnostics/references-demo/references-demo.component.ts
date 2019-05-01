/// <reference path="../../../../mytypings/pouchdb.d.ts" />

import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';
import {JsUtil} from '../../universal/JsUtil';
//import * as PouchDB from 'pouchdb'


declare var document:any ;
declare var window:any ;

@Component({
  selector: 'app-references-demo',
  templateUrl: 'references-demo.component.html'
})
export class ReferencesDemoComponent {
  objectId : number ;
  now : any ;
  lastItem : string = "na";
  commonDbUrl : string = "https://siteadmin55:Skicolorado@siteadmin55.cloudant.com/ca_common";
  commonDb : any ;

  constructor() {
    this.objectId = JsUtil.getObjectId() ;
    console.log("ctor.ReferencesDemoComponent",this.objectId) ;

    // try moment out
    this.now = moment().format();

    this.lastItem = _.last(["AA","BBB" ,"CCC"]);
    //PouchDB.plugin('pouchdb-find');

    this.commonDb = new PouchDB(this.commonDbUrl) ;
    console.log("commonDb",this.commonDb) ;

    this.commonDb.getIndexes().then(function (result) {
      console.log("refdemo.GetIndexes.Success",result) ;
    }).catch(function (err) {
      console.log("refdemo.GetIndexes.Failed",err) ;
    });
  }
}
