import React from "react";

class Badge extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
        this.printBadge = this.printBadge.bind(this);
    };
    componentDidMount() {

    }
    onChange(event) {
        var property = event.target.name;
        var value = event.target.value;
        this.props.onChange(property,value);
    }
    printBadge(){
        this.props.onEmit('print_badge', {
            ticket: {
                firstname: this.props.name,
                lastname: ""
            },
            order: {
                company: this.props.company
            },
            table: this.props.table,
            ignoreBadges: true
        });
        this.props.onClose();
    }
    render() {
        if(!this.props.visible) return (
            <div></div>
        )
        return (
            <div className="modal-container" >
                <div className="modal-container-content">
                    <h3>Badge printen</h3>
                    <hr />
                    <form>
                        <div className="form-group">
                            <label>Naam</label>
                            <input name="name" onChange={this.onChange} value={this.props.name} type="text" className="form-control" placeholder="Naam" />
                        </div>
                        <div className="form-group">
                            <label>Bedrijf</label>
                            <input name="company" onChange={this.onChange} value={this.props.company} type="text" className="form-control" placeholder="Bedrijfsnaam" />
                        </div>
                        <div className="form-group">
                            <label>Tafel</label>
                            <input name="table" onChange={this.onChange} value={this.props.table} type="text" className="form-control" placeholder="Tafelnummer" />
                        </div>
                        <button onClick={this.printBadge} type="submit" className="btn btn-block btn-primary">Afdrukken</button>
                        <button onClick={this.props.onClose} type="button" className="btn btn-block btn-link">Annuleren</button>
                    </form>
                </div>
            </div>
        )
    }
};

module.exports = Badge;