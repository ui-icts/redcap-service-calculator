import jsonata from "jsonata";

//Services catalog data utility class
class ServiceData 
{
  constructor (data, setData)
  {
    this.stateData = data;
    this.setStateData = setData;

    this.fetchServicesFromApi = this.fetchServicesFromApi.bind(this);
    this.filterServiceInstancesByKeyword =  this.filterServiceInstancesByKeyword.bind(this);
    this.parseJsonListOfServices = this.parseJsonListOfServices.bind(this);
  }

  //side effect of setting state in component's state passed into constructor
  fetchServicesFromApi()
  {
    //if using outside of REDCap External module, make sure this path code is adjust to match your API endpoint
    let basePath = 'http://2019augredcap:8888/redcap';//customize basePath for your development or production environment

    const localUri = window.location.href;
    const found = localUri.indexOf("/redcap");//location of REDCap directory to prepend the API request path to
    if (found > -1) 
    {
      basePath = localUri.substring(0, found+7);
    }

    const serviceCatalogAPI = basePath + '/api/?NOAUTH&type=module&prefix=budget_calculator&page=api/service_catalog_api';

    fetch(serviceCatalogAPI)
      .then(response => response.json())
      .then(jsondata => {
        this._jsondata = jsondata;//need this for searches
        this.parseJsonListOfServices(jsondata);
        if (this.fullServiceList) 
        {
          this.setStateData(this.fullServiceList);
        }
        else
        {
          this.setStateData([]);
        }
      }).catch(err => this.setStateData([]));
  }

  filterServiceInstancesByKeyword( rawSearchWord )
  {
    //clean up searchWord
    let searchWord = rawSearchWord.replace(/[\\/]+/gi, '');

    // Set stateData with filtered array of ServiceInstances
    // To improve search speed, search the larges fields last
    // Filter by 'core', 'category', 'service' and 'service_description' that contain search word.
    // Is 'this._jsondata' good data? If not set data to empty array
    let jsonataSearch = '$filter(**.service_list.*^(service), function($v) {$contains($v.core, /'+searchWord+'/i) or $contains($v.category, /'+searchWord+'/i) or $contains($v.service, /'+searchWord+'/i) or $contains($v.service_description, /'+searchWord+'/i) })';

    if ((! searchWord) || (searchWord.trim()===0)) 
    {
      jsonataSearch = '**.service_list.*^(service)';
    }

    let dataFound = jsonata( jsonataSearch ).evaluate(this._jsondata);

    if (! dataFound) 
    {
      dataFound = [];
    }
    else if (!Array.isArray(dataFound))
    {
      dataFound = [dataFound];
    }
    
    this.setStateData( 
       dataFound
      );

  }

  parseJsonListOfServices(serviceJson)
  {
    // using JSONata to search for the proper objects
    this.fullServiceList = jsonata('**.service_list.*^(service)').evaluate(serviceJson);
  }

}

export default ServiceData;