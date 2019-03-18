//import * as d3 from "d3";
//schematic_url contains the json for the schematic (built by graph editor)
//data_url contains the json for the data associated with nodes of the schematic_url
//the node values of the schematic is the flow into that junction.
//junctions that will be ignored are marked with title matching "Junction"
combine_schematic_with_data = function(schematic_url, data_url, dothis) {
  var data;
  d3.json(schematic_url).then(function(d) {
    schematic = d;
    d3.json(data_url).then(function(d) {
      data = d;
      datamap = d3.map(data.nodevalues, function(d) {
        return d.id
      });
      schematic.edges.forEach(function(d) {
        source_value = datamap.get(d.source).value
        target_value = datamap.get(d.target).value
        if (source_value > 0 && target_value > 0) {
          d.value = source_value;
        } else {
          d.value = target_value;
        }
      });
      dothis(schematic);
    })
  });
}

// draws sankey based on data combined
draw_sankey = function(data) {
  var nodemap = d3.map(data.nodes, function(d) {
    return d.id
  })

  graph_x = d3.extent(data.nodes, function(d) {
    return d.x
  });
  graph_y = d3.extent(data.nodes, function(d) {
    return d.y
  });

  d3.select('svg')
    .attr("width", (1.2 * (graph_x[1] - graph_x[0]) + 100) + "px")
    .attr("height", (1.2 * (graph_y[1] - graph_y[0]) + 100) + "px")
    .attr("transform", "translate(" + (-graph_x[0] + 20) + "," + (-graph_y[0] + 20) + ")")
  d3.select('svg').append("defs")
  .append("marker").attr("id","arrow").attr("orient","auto")
  .attr("markerWidth",1).attr("markerHeight",1)
  .attr("viewBox","-3 -3 6 6")
  .attr("refX",3).attr("refY",1)
  .append("polygon").attr("points","-1,0 -3,3 3,0 -3,-3")
  .style("fill","royalblue")
  //link horizontal or vertical would be an option
  var link_vertical = d3.linkVertical()
    .x(function(d) {
      return d[0]
    })
    .y(function(d) {
      return d[1]
    });
  var link_horizontal = d3.linkHorizontal()
    .x(function(d) {
      return d[0]
    })
    .y(function(d) {
      return d[1]
    });
  var data_extent = d3.extent(data.edges, function(d) {
    return Math.abs(d.value)
  });
  var scale = d3.scaleLinear()
    .domain(data_extent).range([2, 100]);
  // The flow paths themselves
  var edgelines = d3.select('svg').append('g').selectAll('path').data(data.edges)
    .enter().append('path')
    .attr('id', function(d, i) {
      return "edge" + i
    })
    .attr('d', function(edge) {
      var source = nodemap.get(edge.source)
      var target = nodemap.get(edge.target)
      // get all edges starting from source and space them perfectly
      var link_data = {
        source: [source.x, source.y],
        target: [target.x, target.y]
      }
      var link = link_horizontal;
      if (target.x == source.x) {
        link = link_horizontal
      } else {
        slope = Math.abs((target.y - source.y) / (target.x - source.x));
        if (slope > 1) {
          link = link_vertical;
        } else {
          link = link_horizontal;
        }
      }
      return link(link_data)
    })
    .style("stroke-width",
      function(edge) {
        return Math.round(scale(Math.abs(edge.value))) + "px";
      })
    .style("fill", "none")
    .style("stroke", function(edge) {
      return edge.value < 0 ? "red" : "royalblue";
    })
    .style("stroke-opacity", "0.67")
    .style("marker-end", "url(#arrow)")
    .append("svg:title").text(function(edge) {
      return d3.format("0.1f")(edge.value) + " TAF";
    });
  // Text along the path
  d3.select('svg').append('g').selectAll("text").data(data.edges)
    .enter()
    .append('text')
    .style('fill','black')
    .attr('transform', function(edge) {
      var source = nodemap.get(edge.source)
      var target = nodemap.get(edge.target)
      line_angle = Math.atan2(target.y - source.y, target.x - source.x)
      line_angle = line_angle * 180 / Math.PI
      if (Math.abs(line_angle) > 90) {
        angle = 180
      } else {
        angle = 0
      }
      cx = target.x + source.x
      cx = cx / 2
      cy = target.y + source.y
      cy = cy / 2
      var translate = Math.round(scale(Math.abs(edge.value)))/2+2;
      var xt=Math.cos(line_angle)*translate
      var yt=Math.sin(line_angle)*translate
      return 'rotate(' + angle + ',' + cx + ',' + cy + ')';
        //+ ' ' + 'translate('+xt+','+yt+')'
    })
    .append('textPath')
    .attr('xlink:href', function(d, i) {
      return '#edge' + i
    })
    .attr('startOffset', '50%')
    .attr('side', 'left')
    .style('text-anchor', 'middle')
    .text(function(edge) {
      return d3.format("0.1f")(edge.value) + " TAF";
    })
  // -- Text for the important end and starting nodes
  filtered_nodes =
    data.nodes.filter(function(d) {
      return d.title.indexOf('Junction') < 0;
    })
  d3.select('svg').append('g').selectAll('text').data(filtered_nodes)
    .enter().append('text')
    .attr('x', function(d) {
      return d.x
    })
    .attr('y', function(d) {
      return d.y
    })
    .text(function(d) {
      return d.title
    })
}
