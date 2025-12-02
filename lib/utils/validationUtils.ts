export function isEmpty(value: any): boolean {
  if(typeof value == "string"){
    const tv = value.trim();
    return tv == "" || tv == null || tv == undefined;
  }
  return value == "" || value == null || value == undefined || ( value != null && typeof value == "object" && !Object.keys(value).length );
}