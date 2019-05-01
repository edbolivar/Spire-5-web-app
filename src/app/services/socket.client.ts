import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import * as moment from 'moment';
import {IMessage, InputMessage, OutputMessage} from '../services/messages';
import {JsUtil} from '../universal/JsUtil';
import {AppInfoService} from './app-info.service';
import Socket from 'socket.io-client' ;
import {PublishEvent, PubSubEventArgs, PubSubTopic, SubscribeEvent} from '../universal/pub-sub-types';
const sio = require('socket.io-client');

import {tryCatch} from 'rxjs/util/tryCatch';
import {SignalR, SignalRConnection, BroadcastEventListener, ConnectionStatus} from 'ng2-signalr';


@Injectable()
export class SocketClient {
  objectId: number;
  private socket: Socket;
  private appInfo: AppInfoService;
  signalRConnection: SignalRConnection;
  lastSignalRMessage = '';
  lastSignalRTime = 0;
  isDebug = false ;
  constructor( private _signalR: SignalR) {
    this.objectId = JsUtil.getObjectId();
    console.log('ctor.SocketClient', this.objectId);
  }

  initialize(appInfo: AppInfoService) {
    const self = this;
    this.appInfo = appInfo;
    this.isDebug = appInfo.config.isSocketDebug;

    this.wireUpSocketIo();
    this.wireUpSignalR();

    this.subscribeToServerEvents() ;

    // have to get it a moment to get the connection 
    // established
    setTimeout(function() {
      if (self.isDebug) { console.log('====> Sending ConsumerUi Activated'); }
      PublishEvent.Create('ConsumerUi Activated', this.objectId);
    }, 5000);

  }

  wireUpSignalR() {
    if (this.appInfo.config.serverHost !== 'spireplus') {
      return ;
    }

    const self = this;
    if (self.isDebug) { console.log('**Attempting to connect to signalR'); }
    this._signalR.connect().then(function(res){
      if (self.isDebug) { console.log('**=> Connected to SignalR'); }
      self.signalRConnection = <SignalRConnection> res ;
     // console.log('signalr connection', self.signalRConnection);

      // listen for connection errors
      self.signalRConnection.errors.subscribe((error: any) => {
        self.signalRError(error);
      });
      self.signalRConnection.status.subscribe((status: ConnectionStatus) => {
        if (self.isDebug) { console.log('===signalr.connection status===', status); }
      });

        // 1.create a listener object
      const onMessageSent$ = new BroadcastEventListener<PubSubEventArgs>('ServerToClient');
     

      // 2.register the listener
      self.signalRConnection.listen(onMessageSent$);
      

      // 3.subscribe for incoming messages
      onMessageSent$.subscribe((e: PubSubEventArgs) => {
        self.handleMessageFromServerViaSignalR(e);
      });

    }).catch(function(err) {
      console.log('=>SignalR Connected Failed', err);
    });
  }

  signalRError(err: any) {
    if (err.message.startsWith('Connection started reconnecting')) {
      return ;
    }

    if (err.message === 'WebSocket closed.') {
      return ;
    }

    console.log('=== SignalR Error ===', err);
  }

  handleMessageFromServerViaSignalR(e: PubSubEventArgs) {
    const self = this;
    if (self.isDebug) { console.log('=>Received from SignalR', e); }
    const incomingMessage = JSON.stringify(e);
    const msgTime = new Date().getTime();
    if (incomingMessage === this.lastSignalRMessage) {
      if (msgTime < (this.lastSignalRTime + 1000)) {
        if (self.isDebug) { console.log('Duplicate SignalR, Skipping ClientSide PubSub'); }
        return ;
      }
    }
    this.lastSignalRMessage = incomingMessage;
    this.lastSignalRTime = msgTime ;

    
    // received message from server, simply publish it
    // out on the local
    PublishEvent.Create(e.pubsubTopic, e.sourceObjectId)
      .SetDataArgumentTo(e.data)
      .Send();
  }


  wireUpSocketIo() {
    if (this.appInfo.config.serverHost !== 'altspire') {
      return ;
    }


    const self = this ;
    if (self.isDebug) { console.log('==>Attempting socket.io connection at url:', this.appInfo.config.urls.socket); }
    self.socket = sio.connect(this.appInfo.config.urls.socket);
        this.socket.on('ServerToClient', function (data: string) {
          const e: PubSubEventArgs = JSON.parse(data);
          self.handleMessageFromServerViaSocketIO(e);
        });
  }

  handleMessageFromServerViaSocketIO(e: PubSubEventArgs) {
    // received message from server, simply publish it
    // out on the local pubsubb
    PublishEvent.Create(e.pubsubTopic, e.sourceObjectId)
      .SetDataArgumentTo(e.data)
      .Send();
  }

  // called from pubsub as part of publish process
  send(e: PubSubEventArgs): void {
    const self = this;
    if (self.isDebug) { console.log('sending event to server', e); }
   
    const eAsString = JSON.stringify(e);

    if (this.socket) {
      try {
        self.socket.emit('ClientToServer', eAsString);
      } catch (err) {
        console.log('Error', err);
      }
    }

    if (this.signalRConnection) {
      // invoke a server side method, with parameters
      this.signalRConnection.invoke('ClientToServer', JSON.stringify(e))
        .then((data: string[]) => {
            // success, signalR send
        }).catch(function (err) {
          if (err.message.startsWith('Connection started reconnecting')) {
            console.log('==send error==', 'Connection is Reconnecting');
            return ;
          }
          console.log('SignalR Send Error=>', err, JSON.stringify(e));
          self.wireUpSignalR();
      });
    } else {
        console.log('no signalR connection to send to');
    }
  }

  subscribeToServerEvents() {
      const self = this;

      SubscribeEvent.Create(PubSubTopic.pingClient, this.objectId)
        .HandleEventWithThisMethod(function(e: PubSubEventArgs) {
            if (self.isDebug) { console.log('received ping from server, publishing ack'); }
            PublishEvent.Create(PubSubTopic.pingClientAck, self.objectId)
              .Send();
        }).Done();

    SubscribeEvent.Create(PubSubTopic.pingServerAck, this.objectId)
      .HandleEventWithThisMethod(function(e) {
         if (self.isDebug) { console.log('received pingAck from server'); }
      }).Done();


      setInterval(function() {
        const timenow = moment().format('dddd, MMMM Do YYYY, h:mm:ss a');
        if (self.isDebug) { console.log('sending ping to server', timenow); }
        PublishEvent.Create(PubSubTopic.pingServer, self.objectId)
          .Send();
      }, 60000);
  }


}
