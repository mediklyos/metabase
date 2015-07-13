'use strict';

import DataReferenceQueryButton from './data_reference_query_button.react';
import Icon from './icon.react';
import Query from './query';
import inflection from 'inflection';

var cx = React.addons.classSet;

export default React.createClass({
    displayName: 'DataReferenceField',
    propTypes: {
        Metabase: React.PropTypes.func.isRequired,
        runQueryFn: React.PropTypes.func.isRequired,
        setQueryFn: React.PropTypes.func.isRequired,
        setDatabaseFn: React.PropTypes.func.isRequired,
        setSourceTableFn: React.PropTypes.func.isRequired,
        setDisplayFn: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
        return {
            table: undefined
        };
    },

    componentWillMount: function() {
        this.props.Metabase.table_query_metadata({
            'tableId': this.props.field.table_id
        }).$promise.then((table) => {
            table = this.props.markupTableMetadata(table);
            this.setState({ table: table });
        });
    },

    filterBy: function() {
        var query = this.setDatabaseAndTable();
        // Add an aggregation so both aggregation and filter popovers aren't visible
        if (!Query.hasValidAggregation(query.query)) {
            Query.updateAggregation(query.query, ["rows"]);
        }
        Query.addFilter(query.query);
        Query.updateFilter(query.query, Query.getFilters(query.query).length - 1, [null, this.props.field.id, null]);
        this.setQuery(query, false);
    },

    groupBy: function() {
        var query = this.setDatabaseAndTable();
        if (!Query.hasValidAggregation(query.query)) {
            Query.updateAggregation(query.query, ["rows"]);
        }
        Query.addDimension(query.query);
        Query.updateDimension(query.query, this.props.field.id, query.query.breakout.length - 1);
        this.setQuery(query);
    },

    setQuerySum: function() {
        var query = this.setDatabaseAndTable();
        query.query.aggregation = ["sum", this.props.field.id];
        query.query.breakout = [];
        query.query.filter = [];
        this.setQuery(query);
    },

    setQueryDistinct: function() {
        var query = this.setDatabaseAndTable();
        query.query.aggregation = ["rows"];
        query.query.breakout = [this.props.field.id];
        query.query.filter = [];
        this.setQuery(query);
    },

    setQueryCountGroupedBy: function(chartType) {
        var query = this.setDatabaseAndTable();
        query.query.aggregation = ["count"];
        query.query.breakout = [this.props.field.id];
        query.query.filter = [];
        this.setQuery(query);
        this.props.setDisplayFn(chartType);
    },

    setDatabaseAndTable: function() {
        var query;
        query = this.props.setDatabaseFn(this.state.table.db_id);
        query = this.props.setSourceTableFn(this.state.table.id);
        return query;
    },

    setQuery: function(query, run) {
        query = this.props.setQueryFn(query);
        if (run || run === undefined) {
            this.props.runQueryFn(query);
        }
    },

    render: function() {
        var fieldName = inflection.humanize(this.props.field.name);
        var tableName = inflection.humanize(this.state.table ? this.state.table.name : "");

        var validForCurrentQuestion = !this.props.query.query || this.props.query.query.source_table == undefined || this.props.query.query.source_table === this.props.field.table_id;

        var useForCurrentQuestion;
        if (validForCurrentQuestion) {
            var validBreakout = this.state.table && this.state.table.breakout_options.fields.filter((f) => f[0] === this.props.field.id).length > 0;
            var useForCurrentQuestionArray = [];
            useForCurrentQuestionArray.push(
                <li className="mt1">
                    <a className="Button Button--white text-default no-decoration" href="#" onClick={this.filterBy}>
                        <Icon className="mr1" name="add" width="12px" height="12px"/> Filter by {name}
                        </a>
                </li>
            );
            if (validBreakout) {
                useForCurrentQuestionArray.push(
                    <li className="mt1">
                        <a className="Button Button--white text-default no-decoration" href="#" onClick={this.groupBy}>
                            <Icon className="mr2" name="add" width="12px" height="12px" /> Group by {name}
                        </a>
                    </li>
                );
            }
            useForCurrentQuestion = (
                <div>
                    <p className="text-bold">Use for current question</p>
                    <ul className="my2">{useForCurrentQuestionArray}</ul>
                </div>
            );
        }

        var usefulQuestions = [];
        if (this.props.field.special_type === "number") {
            usefulQuestions.push(<li><DataReferenceQueryButton icon="illustration-icon-scalar" text={"Sum of all values of " + fieldName} onClick={this.setQuerySum} /></li>);
        }
        usefulQuestions.push(<li><DataReferenceQueryButton icon="illustration-icon-table" text={"All distinct values of " + fieldName} onClick={this.setQueryDistinct} /></li>);
        var queryCountGroupedByText = "Number of " + inflection.pluralize(tableName) + " grouped by " + fieldName;
        usefulQuestions.push(<li><DataReferenceQueryButton icon="illustration-icon-bars" text={queryCountGroupedByText} onClick={this.setQueryCountGroupedBy.bind(null, "bar")} /></li>);
        usefulQuestions.push(<li><DataReferenceQueryButton icon="illustration-icon-pie" text={queryCountGroupedByText} onClick={this.setQueryCountGroupedBy.bind(null, "pie")} /></li>);

        return (
            <div>
                <h1>{fieldName}</h1>
                <p>{this.props.field.description}</p>
                {useForCurrentQuestion}
                <p className="text-bold">Potentially useful questions</p>
                <ul className="DataReference-usefulQuestions">{usefulQuestions}</ul>
            </div>
        );
    },
})
