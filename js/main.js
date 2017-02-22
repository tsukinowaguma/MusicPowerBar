window.onload = function(){
	new bars().init();
}

var bars =function(){
	this.file = null;	//记录文件
	this.filename =null;	//用于记录文件名，用于在传递文件时分析文件是否为音乐文件
	this.audioctx = null;	//记录AudioContext对象用于解码ArrayBuffer数据获得AudioBuffer数据
	this.source = null; //记录AudioBufferSource对象用于关联播放与控制
};

bars.prototype =  {
	init : function(){
		this.file_upload();
		this.control();
	},

	file_upload : function(){
		//保存this
		var _bars = this;	
		var audio_input = document.getElementById("uploadedFile"); 
		var replay = document.getElementById("replay");
		var paused = document.getElementById("paused");
		var info = document.getElementById("info");
		//当audio有文件上传的时候
		audio_input.onchange = function(){
			//如果有播放歌曲的话取消audioctx从而重新实例一个aduioctx文件
			if(_bars.audioctx) _bars.audioctx.close();	
			//确认是否有上传文件		
			if(audio_input.files.length !== 0){
				//将文件、文件名传值
				_bars.file = this.files[0];
				_bars.filename = _bars.file.name;
				//检验是否为音乐格式 不是音乐格式则返回
				var names =_bars.filename.split(".");
				var type_name = names[names.length-1];
				if(type_name != "mp3" | "wma" |"wav"|"flac"|"ape"|"asf" ){
					info.innerHTML = "不是音乐格式";
					return;
				}
				//此时上传成功则改变info
				info.innerHTML= "正在转码";
				//让重新开始的按钮消失
				replay.setAttribute("style","display:none");
				paused.setAttribute("style","display:block");
				//让缓存清空
				_bars.audiobuffer = null;
				//实例一个AudioContext对象并传值
				_bars.audioctx = new (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext)();
				//执行下面的函数
				_bars.start();
			}
		};
	},

	start:function(){
		var _bars = this;
		var file  = this.file;
		//实例一个FileReader对象
		var reader  = new FileReader();
		var audioctx = this.audioctx;
		//file转换为arrayBuffer类型 其result为返回的arraybuffer数据
		reader.readAsArrayBuffer(file);
		reader.onload = function (e) {
			var result = e.target.result;
			//解码ArrayBuffer数据获得AudioBuffer用来回调执行play函数
			audioctx.decodeAudioData(result).then(function(buffer) {
  				_bars.play(buffer);
			});
		};
	},
	play : function(buffer){
		var _bars=this;
		var info = document.getElementById("info");
		var fileWrapper = document.getElementById("fileWrapper");
		//根据API实例一个AudioBufferSource对象,只有通过这个对象才能播放音频
		var buffer_source= this.audioctx.createBufferSource();
		this.source = buffer_source;
		//实例一个分析器来分析音频文件的频谱
		var analyser =this.audioctx.createAnalyser();
		//将BufferSource对象连接到分析器
		this.source.connect(analyser);
		//bufferSource对象的buffer属性用来存储之前获得的缓冲,并得以记录关联开关控制
		this.source.buffer = buffer;
		//连接audioctx.destination属性
		this.source.connect(_bars.audioctx.destination);
		//开始播放
		this.source.start();
		//改变样式
		info.innerHTML = "正在播放" + _bars.filename;
		fileWrapper.setAttribute("style","opacity:0.5");
		//开始作图
		this.draw(analyser);
	},

	draw : function(analyser){
		var canvas = document.getElementById('canvas'),
   		cwidth = canvas.width,
		cheight = canvas.height - 2,
    	meterWidth = 10, //能量条的宽度
    	gap = 2, //能量条间的间距
    	meterNum = cwidth / (meterWidth + gap), //计算当前画布上能画多少条
    	ctx = canvas.getContext('2d');
		//定义一个渐变样式用于画图
		gradient = ctx.createLinearGradient(0, 0, 0, 300);
		gradient.addColorStop(1, '#0f0');
		gradient.addColorStop(0.5, '#ff0');
		gradient.addColorStop(0, '#f00');
		ctx.fillStyle = gradient;
		var drawMeter = function() {
		    var array = new Uint8Array(analyser.frequencyBinCount);
		    analyser.getByteFrequencyData(array);
		    var step = Math.round(array.length / meterNum); //计算采样步长
		    ctx.clearRect(0, 0, cwidth, cheight); //清理画布准备画画
		    for (var i = 0; i < meterNum; i++) {
		        var value = array[i * step];//用来决定高度
		        ctx.fillRect(i * 12 /*频谱条的宽度+条间间距*/ , cheight - value , meterWidth, cheight);
		    }
		    requestAnimationFrame(drawMeter);
		}
		drawMeter();
	},

	//开关控制
	control: function(){
		var paused = document.getElementById("paused");
		var replay = document.getElementById("replay");
		var _bars =this;
		paused.onclick = function(){
			if(!_bars.source) return;	
			_bars.source.stop();
			replay.setAttribute("style","display:block");
			paused.setAttribute("style","display:none");
		}
		replay.onclick = function(){
			if(!_bars.source) return;
			_bars.play(_bars.source.buffer);
			replay.setAttribute("style","display:none");
			paused.setAttribute("style","display:block");
		}
	}
}

