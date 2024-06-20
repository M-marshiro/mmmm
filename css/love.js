// Khởi tạo các đối tượng và hàm chính cho cây, nhánh, hoa
var Vector = function(x, y) {
    this.x = x;
    this.y = y;
};

Vector.prototype = {
    add: function(vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
    },
    sub: function(vector) {
        return new Vector(this.x - vector.x, this.y - vector.y);
    },
    mul: function(scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    },
    div: function(scalar) {
        return new Vector(this.x / scalar, this.y / scalar);
    },
    length: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },
    normalize: function() {
        var length = this.length();
        return new Vector(this.x / length, this.y / length);
    }
};

var Point = function(x, y) {
    this.x = x;
    this.y = y;
};

Point.prototype = {
    move: function(vector) {
        this.x += vector.x;
        this.y += vector.y;
    }
};

var Branch = function(point1, point2, point3, width) {
    this.point1 = point1;
    this.point2 = point2;
    this.point3 = point3;
    this.width = width;
};

Branch.prototype = {
    draw: function(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.point1.x, this.point1.y);
        ctx.bezierCurveTo(
            this.point2.x, this.point2.y,
            this.point2.x, this.point2.y,
            this.point3.x, this.point3.y
        );
        ctx.lineWidth = this.width;
        ctx.lineCap = "round";
        ctx.strokeStyle = "brown";
        ctx.stroke();
    }
};

var Bloom = function(point, radius, petalCount, petalLength, petalWidth, petalColor, centerColor) {
    this.point = point;
    this.radius = radius;
    this.petalCount = petalCount;
    this.petalLength = petalLength;
    this.petalWidth = petalWidth;
    this.petalColor = petalColor;
    this.centerColor = centerColor;
};

Bloom.prototype = {
    draw: function(ctx) {
        for (var i = 0; i < this.petalCount; i++) {
            var angle = (Math.PI * 2 / this.petalCount) * i;
            var x = this.point.x + Math.cos(angle) * this.petalLength;
            var y = this.point.y + Math.sin(angle) * this.petalLength;

            ctx.beginPath();
            ctx.ellipse(this.point.x, this.point.y, this.petalWidth, this.petalLength, angle, 0, Math.PI * 2);
            ctx.fillStyle = this.petalColor;
            ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(this.point.x, this.point.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.centerColor;
        ctx.fill();
    },

    // Thêm hàm blowAway vào đối tượng Bloom
    blowAway: function(direction, speed, duration) {
        var self = this;
        var startTime = Date.now();
        var endTime = startTime + duration;

        function fly() {
            var currentTime = Date.now();
            if (currentTime >= endTime) return;

            self.point.x += direction.x * speed;
            self.point.y += direction.y * speed;

            // Tăng tốc độ bay dần dần
            speed += 0.05;

            requestAnimationFrame(fly);
        }

        requestAnimationFrame(fly);
    }
};

var Tree = function(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.branchs = [];
    this.blooms = [];
    this.seed = new Point(width / 2, height); // Hạt giống (gốc cây)
};

Tree.prototype = {
    draw: function() {
        this.branchs.forEach(branch => branch.draw(this.ctx));
        this.blooms.forEach(bloom => bloom.draw(this.ctx));
    },

    growBranch: function(branch) {
        this.branchs.push(branch);
    },

    growBloom: function(bloom) {
        this.blooms.push(bloom);
    },

    // Thêm hàm blowWind vào đối tượng Tree
    blowWind: function(strength, duration) {
        var self = this;
        var startTime = Date.now();
        var endTime = startTime + duration;

        function moveWithWind() {
            var currentTime = Date.now();
            if (currentTime >= endTime) return;

            var progress = (currentTime - startTime) / duration;
            var offsetX = strength * Math.sin(progress * Math.PI); // Di chuyển theo hình sin để tạo hiệu ứng gió

            // Di chuyển toàn bộ cây và các bông hoa
            self.seed.move(new Point(offsetX, 0));
            self.branchs.forEach(branch => {
                branch.point1.x += offsetX;
                branch.point2.x += offsetX;
                branch.point3.x += offsetX;
            });
            self.blooms.forEach(bloom => {
                bloom.point.x += offsetX;
            });

            // Vẽ lại canvas
            self.ctx.clearRect(0, 0, self.width, self.height);
            self.draw();

            requestAnimationFrame(moveWithWind);
        }

        requestAnimationFrame(moveWithWind);
    },

    // Thêm hàm formText vào đối tượng Tree để tạo các điểm từ văn bản
    formText: function(text, fontSize, x, y) {
        this.ctx.font = `${fontSize}px Arial`;
        this.ctx.fillText(text, x, y);
        var imageData = this.ctx.getImageData(x, y - fontSize, this.ctx.measureText(text).width, fontSize * 2);
        var pixels = imageData.data;

        var points = [];
        for (var i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] > 128) { // Kiểm tra độ trong suốt
                var px = (i / 4) % imageData.width;
                var py = Math.floor((i / 4) / imageData.width);
                points.push(new Point(px + x, py + y - fontSize));
            }
        }

        this.ctx.clearRect(0, 0, this.width, this.height); // Xóa văn bản từ canvas

        return points;
    },

    // Thêm hàm createWindAndFormText vào đối tượng Tree để kết hợp các bước tạo hiệu ứng
    createWindAndFormText: function() {
        var self = this;
        var windStrength = 10; // Độ mạnh của gió
        var windDuration = 2000; // Thời gian gió thổi qua trong ms
        var text = "Sinh nhật vui vẻ";
        var fontSize = 48;
        var textPoints = this.formText(text, fontSize, this.width / 2 - 100, this.height / 2);

        // Bước 1: Thổi gió qua cây
        this.blowWind(windStrength, windDuration);

        // Bước 2: Các bông hoa bị thổi bay và hợp thành chữ
        setTimeout(function() {
            var i = 0;
            self.blooms.forEach(bloom => {
                if (i < textPoints.length) {
                    var targetPoint = textPoints[i];
                    var direction = targetPoint.sub(bloom.point).div(50); // Di chuyển đến điểm mục tiêu
                    bloom.blowAway(direction, 1, 2000);
                    i++;
                }
            });
        }, windDuration);
    }
};

// Sử dụng các hàm đã tạo để tạo hiệu ứng
window.onload = function() {
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var tree = new Tree(ctx, canvas.width, canvas.height);

    // Thêm nhánh vào cây (vị trí tùy chọn)
    tree.growBranch(new Branch(new Point(400, 600), new Point(400, 500), new Point(400, 400), 20));
    tree.growBranch(new Branch(new Point(400, 500), new Point(350, 450), new Point(300, 400), 15));
    tree.growBranch(new Branch(new Point(400, 500), new Point(450, 450), new Point(500, 400), 15));

    // Thêm hoa vào cây (vị trí tùy chọn)
    tree.growBloom(new Bloom(new Point(300, 400), 5, 5, 20, 10, "pink", "yellow"));
    tree.growBloom(new Bloom(new Point(500, 400), 5, 5, 20, 10, "red", "yellow"));
    tree.growBloom(new Bloom(new Point(400, 400), 5, 5, 20, 10, "white", "yellow"));

    // Vẽ cây ban đầu
    tree.draw();

    // Bắt đầu hiệu ứng
    tree.createWindAndFormText();
};
