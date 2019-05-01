export class IMessage{
 Command:string;
 DateTime :Date;
}

export class InputMessage extends IMessage
{
}
export class OutputMessage extends IMessage
{
    Result:any;
}

