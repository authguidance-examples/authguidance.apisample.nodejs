import Authenticator from '../plumbing/authenticator';
import HttpClient from '../plumbing/httpClient';
import * as $ from 'jquery';

/*
 * Logic related to the list view
 */
export default class DetailsView {
    
    /*
     * Fields
     */
    private _authenticator: Authenticator;
    private _apiBaseUrl: string;
    private _id: number;
    
    /*
     * Class setup
     */
    public constructor(authenticator: any, apiBaseUrl: string, id: number) {
        this._authenticator = authenticator;
        this._apiBaseUrl = apiBaseUrl;
        this._id = id;
        this._setupCallbacks();
    }
    
    /*
     * Run the view
     */
    public async execute(): Promise<void> {

        // Set UI content while loading
        $('#detailsContainer').removeClass('hide');
        $('#detailsContainer').text('Calling API to get golfer details ...');
        
        try {
            // Get data and render it
            let url = `${this._apiBaseUrl}/golfers/${this._id}`;
            let data = await HttpClient.callApi(url, 'GET', null, this._authenticator);
            return this._renderData(data);
        }
        catch (uiError) {
            // If an invalid id is typed in the browser then return to the list page
            if (uiError.statusCode === 404) {
                location.hash ='#';
             }

             throw uiError;
        }
    }

    /*
     * Hide UI elements when the view unloads
     */
    public unload(): void {
        $('#detailsContainer').addClass('hide');
    }
    
    /*
     * Render data
     */
    private  _renderData(golfer: any): void {

        // Clear loading content
        $('#detailsContainer').text('');
        
        // Set button state
        $('.initiallyDisabled').prop('disabled', false);
        $('.initiallyDisabled').removeClass('disabled');

        // Use the full size image
        let golferImage = $(`<a>
                               <img src='images/${golfer.name}.png' class='img-responsive'>
                             </a>`);
            
        // Render summary details
        let golferDiv = $(`<div class='col-xs-6'>
                             <div>Name : <b>${golfer.name}</b></div>
                             <div>Tour Wins : <b>${golfer.tour_wins}</b></div>
                           </div>`);
        golferDiv.append(golferImage);
        $('#detailsContainer').append(golferDiv);
        
        // Render the tour wins container
        let tourWinsDiv = $(`<div class='col-xs-6'>
                               <div><b>All Tour Wins</b></div>
                               <ul id='wins_list'></ul>
                             </div>`);
        $('#detailsContainer').append(tourWinsDiv);
        
        // Render individual win details
        golfer.wins.forEach((win:any) => {
            let info = `${win.year} : ${win.eventName}`;
            $('#wins_list').append($('<li>').html(info));
        });
    }
    
    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this._renderData = this._renderData.bind(this);
   }
}