interface IfcObjectValue {
  value: string | number;
  type: number;
  name: string;
}

export interface IfcQuantityArea {
  expressID: number;
  type: number;
  Name: IfcObjectValue;
  Description: string | null;
  AreaValue: IfcObjectValue;
  Unit: string | null;
}

export interface IfcPropertySingle {
  expressID: number;
  type: number;
  Name: IfcObjectValue;
  Description: string | null;
  NominalValue: IfcObjectValue;
  Unit: string | null;
}

export interface IfcProperty {
  expressID: number;
  Name: string;
  Value: string | number;
}